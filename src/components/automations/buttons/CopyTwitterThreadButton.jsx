"use client";

import ActionButton from "../ActionButton";

function CopyTwitterThreadButton({ data }) {
  const handleClick = async () => {
    const thread = data?.twitterThread;
    if (!Array.isArray(thread) || thread.length === 0) {
      throw new Error("Missing twitter thread");
    }

    const text = data.twitterThread
      .map((tweet, i) => `${i + 1}/ ${tweet}`)
      .join("\n\n");

    await navigator.clipboard.writeText(text);
  };

  return (
    <ActionButton
      icon="??"
      label="Copy Twitter Thread"
      doneLabel="Copied!"
      onClick={handleClick}
    />
  );
}

export default CopyTwitterThreadButton;
