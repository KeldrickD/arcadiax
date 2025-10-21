// Minimal Server-Sent Events (SSE) placeholder to simulate live updates
// Note: Next.js App Router doesn't support native upgrade to WebSocket here.
// We'll stream text events over SSE as a stand-in.

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') ?? 'unknown';

  let closed = false;
  let iv: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (msg: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        } catch {
          // noop if controller already closed
        }
      };

      send(`session:${sessionId} connected`);
      let tick = 0;
      iv = setInterval(() => {
        tick += 1;
        send(`tick ${tick}`);
        if (tick >= 10) {
          if (iv) clearInterval(iv);
          iv = null;
          closed = true;
          try { controller.close(); } catch {}
        }
      }, 1000);

      // handle client aborts
      // @ts-ignore - edge Request has signal
      const signal: AbortSignal | undefined = request.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          if (iv) clearInterval(iv);
          iv = null;
          closed = true;
          try { controller.close(); } catch {}
        });
      }
    },
    cancel() {
      if (iv) clearInterval(iv);
      iv = null;
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}


