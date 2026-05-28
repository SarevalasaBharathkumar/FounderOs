"use client";

import ActionButton from "../ActionButton";

function OpenInGmailButton({ data }) {
  const handleClick = async () => {
    const sequence = Array.isArray(data?.coldEmailSequence) ? data.coldEmailSequence : [];
    if (sequence.length === 0) {
      throw new Error("Missing cold email sequence");
    }

    const dayList = sequence.map((item, index) => item?.day || index + 1);
    const selected = window.prompt(`Which email day to open? Available: ${dayList.join(", ")}`, String(dayList[0]));
    if (selected == null) return;
    const selectedEmail =
      sequence.find((item) => String(item?.day) === String(selected).trim()) ||
      sequence[Number.parseInt(String(selected), 10) - 1];
    if (!selectedEmail) {
      throw new Error("Invalid day selected");
    }

    const subject = encodeURIComponent(selectedEmail.subject || "");
    const body = encodeURIComponent(selectedEmail.body || "");
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
