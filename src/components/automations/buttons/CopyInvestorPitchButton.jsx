"use client";

import ActionButton from "../ActionButton";

function CopyInvestorPitchButton({ data }) {
  const handleClick = async () => {
    const pitch = data?.investorPitch;
    if (!pitch) {
      throw new Error("Missing investor pitch");
    }

    const text = `INVESTOR PITCH\n\nHook: ${pitch.hook}\n\nProblem: ${pitch.problem}\n\nSolution: ${pitch.solution}\n\nTraction: ${pitch.traction}\n\nAsk: ${pitch.ask}`;

    await navigator.clipboard.writeText(text);
  };

  return (
    <ActionButton
      icon="??"
      label="Copy Investor Pitch"
      doneLabel="Copied!"
      onClick={handleClick}
    />
  );
}

export default CopyInvestorPitchButton;
