import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

async function ensureSupportTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboard_support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'General',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureSupportMessagesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboard_support_messages (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL
        REFERENCES dashboard_support_tickets(id)
        ON DELETE CASCADE,
      sender_type TEXT NOT NULL
        CHECK (sender_type IN ('customer', 'support')),
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_dashboard_support_messages_ticket_id
    ON dashboard_support_messages(ticket_id)
  `);

  await pool.query(`
    INSERT INTO dashboard_support_messages (
      ticket_id,
      sender_type,
      message,
      created_at
    )
    SELECT
      t.id,
      'customer',
      t.message,
      t.created_at
    FROM dashboard_support_tickets t
    WHERE t.message IS NOT NULL
      AND BTRIM(t.message) <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM dashboard_support_messages m
        WHERE m.ticket_id = t.id
          AND m.sender_type = 'customer'
          AND m.message = t.message
          AND m.created_at = t.created_at
      )
  `);
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    await ensureSupportTable();
    await ensureSupportMessagesTable();

    const url = new URL(request.url);
    const ticketIdParam = url.searchParams.get("ticketId");

    if (ticketIdParam) {
      const ticketId = Number(ticketIdParam);

      if (!Number.isInteger(ticketId) || ticketId <= 0) {
        return NextResponse.json(
          { error: "Invalid ticket ID." },
          { status: 400 }
        );
      }

      const ticketResult = await pool.query(
        `
          SELECT
            id,
            category,
            subject,
            message,
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM dashboard_support_tickets
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [ticketId, user.id]
      );

      if (ticketResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Ticket not found." },
          { status: 404 }
        );
      }

      const messagesResult = await pool.query(
        `
          SELECT
            id,
            sender_type AS "senderType",
            message,
            created_at AS "createdAt"
          FROM dashboard_support_messages
          WHERE ticket_id = $1
          ORDER BY created_at ASC, id ASC
        `,
        [ticketId]
      );

      return NextResponse.json({
        ticket: ticketResult.rows[0],
        messages: messagesResult.rows,
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          category,
          subject,
          message,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM dashboard_support_tickets
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [user.id]
    );

    return NextResponse.json({
      tickets: result.rows,
    });
  } catch (error) {
    console.error("Load support tickets error:", error);

    return NextResponse.json(
      { error: "Unable to load support tickets." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const ticketIdRaw = body?.ticketId;

    if (
      ticketIdRaw !== undefined &&
      ticketIdRaw !== null &&
      ticketIdRaw !== ""
    ) {
      const ticketId = Number(ticketIdRaw);

      const replyMessage =
        typeof body?.message === "string"
          ? body.message.trim()
          : "";

      if (!Number.isInteger(ticketId) || ticketId <= 0) {
        return NextResponse.json(
          { error: "Invalid ticket ID." },
          { status: 400 }
        );
      }

      if (!replyMessage) {
        return NextResponse.json(
          { error: "Reply message is required." },
          { status: 400 }
        );
      }

      if (replyMessage.length > 5000) {
        return NextResponse.json(
          { error: "Reply is too long." },
          { status: 400 }
        );
      }

      await ensureSupportTable();
      await ensureSupportMessagesTable();

      const ticketResult = await pool.query(
        `
          SELECT
            id,
            category,
            subject,
            status,
            updated_at AS "updatedAt"
          FROM dashboard_support_tickets
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [ticketId, user.id]
      );

      if (ticketResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Ticket not found." },
          { status: 404 }
        );
      }

      await pool.query(
        `
          INSERT INTO dashboard_support_messages (
            ticket_id,
            sender_type,
            message
          )
          VALUES ($1, 'customer', $2)
        `,
        [ticketId, replyMessage]
      );

      const updatedTicketResult = await pool.query(
        `
          UPDATE dashboard_support_tickets
          SET
            status = 'open',
            updated_at = NOW()
          WHERE id = $1
            AND user_id = $2
          RETURNING
            id,
            category,
            subject,
            message,
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [ticketId, user.id]
      );

      const messagesResult = await pool.query(
        `
          SELECT
            id,
            sender_type AS "senderType",
            message,
            created_at AS "createdAt"
          FROM dashboard_support_messages
          WHERE ticket_id = $1
          ORDER BY created_at ASC, id ASC
        `,
        [ticketId]
      );

      return NextResponse.json({
        success: true,
        ticket: updatedTicketResult.rows[0],
        messages: messagesResult.rows,
      });
    }

    const category =
      typeof body?.category === "string" && body.category.trim()
        ? body.category.trim()
        : "General";

    const subject =
      typeof body?.subject === "string"
        ? body.subject.trim()
        : "";

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (subject.length > 160) {
      return NextResponse.json(
        { error: "Subject is too long." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 }
      );
    }

    await ensureSupportTable();
    await ensureSupportMessagesTable();

    const result = await pool.query(
      `
        INSERT INTO dashboard_support_tickets (
          user_id,
          category,
          subject,
          message,
          status
        )
        VALUES ($1, $2, $3, $4, 'open')
        RETURNING
          id,
          category,
          subject,
          message,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        user.id,
        category,
        subject,
        message
      ]
    );

    await pool.query(
      `
        INSERT INTO dashboard_support_messages (
          ticket_id,
          sender_type,
          message
        )
        VALUES ($1, 'customer', $2)
      `,
      [
        result.rows[0].id,
        message
      ]
    );

    return NextResponse.json(
      {
        success: true,
        ticket: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create support ticket error:", error);

    return NextResponse.json(
      { error: "Unable to create support ticket." },
      { status: 500 }
    );
  }
}


