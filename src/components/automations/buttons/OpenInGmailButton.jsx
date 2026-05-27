"use client";

import ActionButton from "../ActionButton";

function OpenInGmailButton({ data }) {
  const handleClick = async () => {
    const firstEmail = data?.coldEmailSequence?.[0];
    if (!firstEmail) {
      throw new Error("Missing cold email sequence");
    }

    const subject = encodeURIComponent(data.coldEmailSequence[0].subject);
    const body = encodeURIComponent(
      data.coldEmailSequence[0].body +
        "\n\n---\n" +
        "Day 3 follow-up:\n" +
        (data.coldEmailSequence[1]?.body || "") +
        "\n\nDay 7 follow-up:\n" +
        (data.coldEmailSequence[2]?.body || "")
    );
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;

    window.open(url, "_blank");
  };

  return (
    <ActionButton
      icon="??"
      label="Open in Gmail"
      doneLabel="Opening Gmail..."
      onClick={handleClick}
    />
  );
}

export default OpenInGmailButton;
