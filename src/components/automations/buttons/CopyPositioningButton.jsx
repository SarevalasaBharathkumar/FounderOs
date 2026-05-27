"use client";

import ActionButton from "../ActionButton";

function CopyPositioningButton({ data }) {
  const handleClick = async () => {
    await navigator.clipboard.writeText(data?.positioningStatement || "");
  };

  return <ActionButton icon="??" label="Copy Positioning" doneLabel="Copied!" onClick={handleClick} />;
}

export default CopyPositioningButton;
