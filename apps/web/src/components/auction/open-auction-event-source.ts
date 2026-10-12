import type { AuctionEvent } from "@bidding-agents/auction/types";
import { isTerminalAuctionEvent } from "@bidding-agents/auction/run";

export function openAuctionEventSource(
  streamId: string,
  onEvent: (event: AuctionEvent) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `/api/auction/stream?id=${encodeURIComponent(streamId)}`;
    const source = new EventSource(url);
    let finished = false;

    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as AuctionEvent;
      onEvent(event);
      if (isTerminalAuctionEvent(event)) {
        finished = true;
        source.close();
        resolve();
      }
    };

    source.onerror = () => {
      source.close();
      if (!finished) {
        reject(new Error("Auction stream failed"));
      }
    };
  });
}
