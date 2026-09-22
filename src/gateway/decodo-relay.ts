import net from "node:net";
import fs from "node:fs";

function loadEnv(path: string) {
  const env: Record<string, string> = {};

  if (!fs.existsSync(path)) {
    throw new Error(`Environment file not found: ${path}`);
  }

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;

    const i = line.indexOf("=");

    if (i < 0) continue;

    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();

    env[key] = value;
  }

  return env;
}

class BufferReader {
  private buffer = Buffer.alloc(0);
  private waiting:
    | {
        size: number;
        resolve: (value: Buffer) => void;
        reject: (error: Error) => void;
      }
    | null = null;

  constructor(private readonly socket: net.Socket) {
    socket.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.flush();
    });

    socket.on("error", (error) => {
      this.waiting?.reject(
        error instanceof Error
          ? error
          : new Error(String(error)),
      );

      this.waiting = null;
    });

    socket.on("close", () => {
      this.waiting?.reject(
        new Error("Socket closed."),
      );

      this.waiting = null;
    });
  }

  private flush() {
    if (!this.waiting) return;

    if (this.buffer.length < this.waiting.size) {
      return;
    }

    const request = this.waiting;

    this.waiting = null;

    const value = this.buffer.subarray(
      0,
      request.size,
    );

    this.buffer = this.buffer.subarray(
      request.size,
    );

    request.resolve(value);
  }

  async readExactly(size: number): Promise<Buffer> {
    if (this.buffer.length >= size) {
      const value = this.buffer.subarray(0, size);
      this.buffer = this.buffer.subarray(size);
      return value;
    }

    return new Promise<Buffer>((resolve, reject) => {
      this.waiting = {
        size,
        resolve,
        reject,
      };

      this.flush();
    });
  }

  async readByte(): Promise<number> {
    return (await this.readExactly(1))[0];
  }
}

async function main() {
  const env = loadEnv(
    `${process.cwd()}/.env.local`,
  );

  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  const { db } = await import("../db/index");
  const { ownedProxies } = await import("../db/schema");
  const { decryptProxyPassword } =
    await import("../lib/proxy-access");
  const { eq, isNotNull } = await import("drizzle-orm");

  const listenHost =
    process.env.NAVA_GATEWAY_HOST ||
    "127.0.0.1";


  const providerCredentialPairs: Record<
    string,
    { username: string; password: string }
  > = {};

  if (
    process.env.DECODO_USERNAME &&
    process.env.DECODO_PASSWORD
  ) {
    providerCredentialPairs.DECODO_DEFAULT = {
      username: process.env.DECODO_USERNAME,
      password: process.env.DECODO_PASSWORD,
    };
  }

  if (
    !providerCredentialPairs.DECODO_DEFAULT
  ) {
    throw new Error(
      "DECODO_USERNAME / DECODO_PASSWORD missing.",
    );
  }

  async function authenticateCustomer(
    socket: net.Socket,
    reader: BufferReader,
  ) {
    const header = await reader.readExactly(2);

    if (header[0] !== 0x05) {
      throw new Error(
        "Invalid SOCKS5 version.",
      );
    }

    const methods = await reader.readExactly(
      header[1],
    );

    if (!methods.includes(0x02)) {
      socket.write(
        Buffer.from([0x05, 0xff]),
      );

      throw new Error(
        "Username/password authentication required.",
      );
    }

    socket.write(
      Buffer.from([0x05, 0x02]),
    );

    const authVersion =
      await reader.readByte();

    if (authVersion !== 0x01) {
      throw new Error(
        "Invalid SOCKS5 auth version.",
      );
    }

    const usernameLength =
      await reader.readByte();

    const username = (
      await reader.readExactly(usernameLength)
    ).toString("utf8");

    const passwordLength =
      await reader.readByte();

    const password = (
      await reader.readExactly(passwordLength)
    ).toString("utf8");

    const [owned] = await db
      .select({
        id: ownedProxies.id,
        accessPasswordEncrypted:
          ownedProxies.accessPasswordEncrypted,
      })
      .from(ownedProxies)
      .where(
        eq(
          ownedProxies.accessUsername,
          username,
        ),
      )
      .limit(1);

    if (!owned) {
      socket.write(
        Buffer.from([0x01, 0x01]),
      );

      throw new Error(
        "Customer credential not found.",
      );
    }

    if (!owned.accessPasswordEncrypted) {
      socket.write(
        Buffer.from([0x01, 0x01]),
      );

      throw new Error(
        "Customer credential is not provisioned.",
      );
    }

    const expectedPassword =
      decryptProxyPassword(
        owned.accessPasswordEncrypted,
      );

    if (expectedPassword !== password) {
      socket.write(
        Buffer.from([0x01, 0x01]),
      );

      throw new Error(
        "Customer password rejected.",
      );
    }

    socket.write(
      Buffer.from([0x01, 0x00]),
    );

    return owned.id;
  }

  async function readConnectRequest(
    reader: BufferReader,
  ) {
    const header =
      await reader.readExactly(4);

    if (
      header[0] !== 0x05 ||
      header[1] !== 0x01
    ) {
      throw new Error(
        "Only SOCKS5 CONNECT is supported.",
      );
    }

    let host: string;

    if (header[3] === 0x01) {
      const ip =
        await reader.readExactly(4);

      host = Array.from(ip).join(".");
    } else if (header[3] === 0x03) {
      const length =
        await reader.readByte();

      host = (
        await reader.readExactly(length)
      ).toString("utf8");
    } else if (header[3] === 0x04) {
      const ip =
        await reader.readExactly(16);

      const groups: string[] = [];

      for(let i = 0; i < 16; i += 2) {
        groups.push(
          ip.readUInt16BE(i).toString(16),
        );
      }

      host = groups.join(":");
    } else {
      throw new Error(
        "Unsupported SOCKS5 address type.",
      );
    }

    const portBuffer =
      await reader.readExactly(2);

    return {
      host,
      port: portBuffer.readUInt16BE(0),
    };
  }

  function encodeConnect(
    host: string,
    port: number,
  ) {
    const hostBuffer =
      Buffer.from(host, "utf8");

    return Buffer.concat([
      Buffer.from([
        0x05,
        0x01,
        0x00,
        0x03,
        hostBuffer.length,
      ]),
      hostBuffer,
      Buffer.from([
        (port >> 8) & 0xff,
        port & 0xff,
      ]),
    ]);
  }

  async function connectThroughProvider(
    socket: net.Socket,
    reader: BufferReader,
    record: {
      transportHost: string | null;
      transportPort: number | null;
      providerCredentialRef: string | null;
    },
    target: {
      host: string;
      port: number;
    },
  ) {
    if (
      !record.transportHost ||
      !record.transportPort ||
      !record.providerCredentialRef
    ) {
      throw new Error(
        "Owned proxy has incomplete provider transport mapping.",
      );
    }

    const credentials =
      providerCredentialPairs[
        record.providerCredentialRef
      ];

    if (!credentials) {
      throw new Error(
        `No provider credentials configured for ${record.providerCredentialRef}.`,
      );
    }

    const upstream =
      net.createConnection({
        host: record.transportHost,
        port: record.transportPort,
      });

    await new Promise<void>(
      (resolve, reject) => {
        upstream.once(
          "connect",
          () => resolve(),
        );

        upstream.once(
          "error",
          reject,
        );
      },
    );

    const upstreamReader =
      new BufferReader(upstream);

    upstream.write(
      Buffer.from([
        0x05,
        0x01,
        0x02,
      ]),
    );

    const method =
      await upstreamReader.readExactly(2);

    if (
      method[0] !== 0x05 ||
      method[1] !== 0x02
    ) {
      upstream.destroy();

      throw new Error(
        "Provider rejected username/password authentication.",
      );
    }

    const userBuffer =
      Buffer.from(
        credentials.username,
        "utf8",
      );

    const passBuffer =
      Buffer.from(
        credentials.password,
        "utf8",
      );

    upstream.write(
      Buffer.concat([
        Buffer.from([
          0x01,
          userBuffer.length,
        ]),
        userBuffer,
        Buffer.from([
          passBuffer.length,
        ]),
        passBuffer,
      ]),
    );

    const auth =
      await upstreamReader.readExactly(2);

    if (auth[1] !== 0x00) {
      upstream.destroy();

      throw new Error(
        "Provider authentication failed.",
      );
    }

    upstream.write(
      encodeConnect(
        target.host,
        target.port,
      ),
    );

    const response =
      await upstreamReader.readExactly(4);

    if (response[1] !== 0x00) {
      upstream.destroy();

      throw new Error(
        `Provider CONNECT failed: ${response[1]}`,
      );
    }

    if(response[3] === 0x01){
      await upstreamReader.readExactly(6);
    }else if(response[3] === 0x03){
      const length =
        await upstreamReader.readByte();

      await upstreamReader.readExactly(
        length + 2,
      );
    }else if(response[3] === 0x04){
      await upstreamReader.readExactly(18);
    }

    socket.write(
      Buffer.from([
        0x05,
        0x00,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]),
    );

    socket.pipe(upstream);
    upstream.pipe(socket);

    socket.once(
      "close",
      () => upstream.destroy(),
    );

    upstream.once(
      "close",
      () => socket.destroy(),
    );
  }

  const listeners = new Map<number, net.Server>();

  async function handleSocket(
    socket: net.Socket,
    expectedOwnedId: number,
    expectedPort: number,
  ) {
    try {
      const reader =
        new BufferReader(socket);

      const authenticatedOwnedId =
        await authenticateCustomer(
          socket,
          reader,
        );

      if (authenticatedOwnedId !== expectedOwnedId) {
        throw new Error(
          "Customer credential does not belong to this public proxy port.",
        );
      }

      const [portRecord] = await db
        .select({
          publicAccessPort:
            ownedProxies.publicAccessPort,
        })
        .from(ownedProxies)
        .where(
          eq(
            ownedProxies.id,
            authenticatedOwnedId,
          ),
        )
        .limit(1);

      if (!portRecord || portRecord.publicAccessPort !== expectedPort) {
        throw new Error("Public proxy port mapping is invalid.");
      }

      const target =
        await readConnectRequest(
          reader,
        );

      const [record] = await db
        .select({
          transportHost:
            ownedProxies.transportHost,
          transportPort:
            ownedProxies.transportPort,
          providerCredentialRef:
            ownedProxies.providerCredentialRef,
        })
        .from(ownedProxies)
        .where(
          eq(
            ownedProxies.id,
            expectedOwnedId,
          ),
        )
        .limit(1);

      if (!record) {
        throw new Error("Owned proxy record not found.");
      }

      await connectThroughProvider(
        socket,
        reader,
        record,
        target,
      );
    } catch (error) {
      console.error(
        "NAVA gateway request failed:",
        error instanceof Error
          ? error.message
          : error,
      );
      socket.destroy();
    }
  }

  async function syncListeners() {
    const rows = await db
      .select({
        id: ownedProxies.id,
        publicAccessPort:
          ownedProxies.publicAccessPort,
      })
      .from(ownedProxies)
      .where(
        isNotNull(
          ownedProxies.publicAccessPort,
        ),
      );

    const activePorts = new Set<number>();

    for (const row of rows) {
      if (!row.publicAccessPort) continue;

      const port = row.publicAccessPort;
      activePorts.add(port);

      if (listeners.has(port)) continue;

      const listener = net.createServer(
        (socket) => {
          void handleSocket(
            socket,
            row.id,
            port,
          );
        },
      );

      listener.on("error", (error) => {
        console.error(
          `NAVA listener ${port} failed:`,
          error,
        );
      });

      listener.listen(
        port,
        listenHost,
        () => {
          console.log(
            `NAVA public proxy listener ready: ${listenHost}:${port}`,
          );
        },
      );

      listeners.set(port, listener);
    }

    for (const [port, listener] of listeners) {
      if (activePorts.has(port)) continue;

      listener.close();
      listeners.delete(port);

      console.log(
        `NAVA public proxy listener removed: ${listenHost}:${port}`,
      );
    }
  }

  await syncListeners();

  setInterval(() => {
    void syncListeners().catch((error) => {
      console.error(
        "NAVA listener synchronization failed:",
        error,
      );
    });
  }, 5000);

  console.log("NAVA DYNAMIC DATABASE-BACKED GATEWAY READY");
  console.log(`Gateway host: ${listenHost}`);
  console.log(
    "Public proxy listeners are loaded from owned_proxies.public_access_port.",
  );
  console.log(
    "Provider transport remains hidden behind owned_proxies.",
  );

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
