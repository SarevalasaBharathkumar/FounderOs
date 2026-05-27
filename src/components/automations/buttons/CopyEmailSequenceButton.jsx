"use client";

import ActionButton from "../ActionButton";

function CopyEmailSequenceButton({ data }) {
  const handleClick = async () => {
    const sequence = data?.coldEmailSequence;
    if (!Array.isArray(sequence) || sequence.length === 0) {
      throw new Error("Missing cold email sequence");
    }

    const text = data.coldEmailSequence
      .map(
        (email) =>
          `--- Day ${email.day} ---\nSubject: ${email.subject}\n\n${email.body}`
      )
      .join("\n\n");

    await navigator.clipboard.writeText(text);
  };

  return (
    <ActionButton
      icon="??"
      label="Copy Email Sequence"
      doneLabel="Copied!"
      onClick={handleClick}
    />
  );
}

export default CopyEmailSequenceButton;
