"use client";

import ActionButton from "../ActionButton";

function escapeCsv(value) {
  return String(value ?? "").replaceAll('"', '""');
}

function DownloadRiskRegisterButton({ data, objective }) {
  void objective;

  const handleClick = async () => {
    const headers = "Category,Risk,Severity,Probability,Mitigation,Status\n";
    const rows = (data?.risks || [])
      .map(
        (r) =>
          `"${escapeCsv(r.category)}","${escapeCsv(r.risk)}","${escapeCsv(r.severity)}","${escapeCsv(r.probability)}","${escapeCsv(r.mitigation)}","Open"`
      )
      .join("\n");
    const csv = headers + rows;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "risk-register.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ActionButton
      icon="⬇️"
      label="Download Risk Register"
      doneLabel="Downloaded!"
      onClick={handleClick}
    />
  );
}

export default DownloadRiskRegisterButton;
