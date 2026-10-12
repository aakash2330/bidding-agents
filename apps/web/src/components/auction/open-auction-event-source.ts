import {
  type AuctionEvent,
  isTerminalAuctionEvent,
} from "@bidding-agents/auction/types";

export type AuctionEventSourceHandle = {
  done: Promise<void>;
  close: () => void;
};

export function openAuctionEventSource(
  streamId: string,
  onEvent: (event: AuctionEvent) => void,
): AuctionEventSourceHandle {
  const url = `/api/auction/stream?id=${encodeURIComponent(streamId)}`;
  const source = new EventSource(url);
  let settled = false;
  let cancelled = false;

  let settle: (error?: Error) => void = () => {};

  const done = new Promise<void>((resolve, reject) => {
    settle = (error?: Error) => {
      if (settled) return;
      settled = true;
      source.close();
      if (error) reject(error);
      else resolve();
    };

    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as AuctionEvent;
      onEvent(event);
      if (isTerminalAuctionEvent(event)) {
        settle();
      }
    };

    source.onerror = () => {
      if (settled) return;
      if (cancelled) {
        settle();
        return;
      }
      settle(new Error("Auction stream failed"));
    };
  });

  return {
    done,
    close: () => {
      if (settled) return;
      cancelled = true;
      settle();
    },
  };
}
