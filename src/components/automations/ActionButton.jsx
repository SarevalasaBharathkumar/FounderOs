"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS, T } from "../../styles/tokens";

const hexToRgba = (hex, alpha) => {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value
        .split("")
        .map((char) => char + char)
        .join("")
    : value;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
};

function ActionButton({
  icon,
  label,
  onClick,
  loading = false,
  done = false,
  doneLabel = "Done!",
  variant = "default",
  disabled = false,
}) {
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  const [isDoneInternal, setIsDoneInternal] = useState(Boolean(done));
  const [isError, setIsError] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsDoneInternal(Boolean(done));
  }, [done]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isLoading = loading || isLoadingInternal;
  const isDone = done || isDoneInternal;
  const isDisabled = disabled || isLoading;

  const styles = useMemo(() => {
    const base = {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "7px 14px",
      borderRadius: "999px",
      fontFamily: FONTS.sans,
      fontWeight: 500,
      fontSize: "0.78rem",
      cursor: isDisabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
      border: "1px solid transparent",
      background: "transparent",
      color: T.textSub,
      transform: "translateY(0)",
    };

    const defaultState = {
      background: hexToRgba(T.text, 0.04),
      border: `1px solid ${hexToRgba(T.text, 0.08)}`,
      color: T.textSub,
    };

    if (variant === "primary") {
      return {
        ...base,
        background: T.text,
        border: `1px solid ${T.text}`,
        color: T.bg,
      };
    }

    if (isLoading) {
      return {
        ...base,
        background: hexToRgba(T.accent, 0.08),
        border: `1px solid ${hexToRgba(T.accent, 0.2)}`,
        color: T.accentBright,
      };
    }

    if (isDone) {
      return {
        ...base,
        background: hexToRgba(T.green, 0.08),
        border: `1px solid ${hexToRgba(T.green, 0.2)}`,
        color: T.green,
      };
    }

    if (isError) {
      return {
        ...base,
        background: hexToRgba(T.red, 0.08),
        border: `1px solid ${hexToRgba(T.red, 0.2)}`,
        color: T.red,
      };
    }

    if (variant === "danger") {
      return {
        ...base,
        background: hexToRgba(T.red, 0.08),
        border: `1px solid ${hexToRgba(T.red, 0.2)}`,
        color: T.red,
      };
    }

    return {
      ...base,
      ...defaultState,
    };
  }, [isDisabled, isDone, isError, isLoading, variant]);

  const hoverStyle = useMemo(() => {
    if (isDisabled || isDone || isError || isLoading) {
      return null;
    }

    if (variant === "primary") {
      return {
        background: "#f4f4f5",
        border: "1px solid #f4f4f5",
        color: T.bg,
        transform: "translateY(-1px)",
      };
    }

    return {
      background: hexToRgba(T.text, 0.07),
      border: `1px solid ${hexToRgba(T.text, 0.15)}`,
      color: T.text,
      transform: "translateY(-1px)",
    };
  }, [isDisabled, isDone, isError, isLoading, variant]);

  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = isHovered && hoverStyle ? { ...styles, ...hoverStyle } : styles;

  const handleClick = async () => {
    if (isDisabled || typeof onClick !== "function") {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      setIsError(false);
      setIsDoneInternal(false);
      setIsLoadingInternal(true);
      await onClick();
      setIsLoadingInternal(false);
      setIsDoneInternal(true);

      timeoutRef.current = setTimeout(() => {
        setIsDoneInternal(false);
      }, 3000);
    } catch (_error) {
      setIsLoadingInternal(false);
      setIsError(true);

      timeoutRef.current = setTimeout(() => {
        setIsError(false);
      }, 1500);
    }
  };

  let text = label;
  if (isLoading) {
    text = "Working...";
  } else if (isDone) {
    text = doneLabel;
  } else if (isError) {
    text = "Failed";
  }

  return (
    <>
      <style>{`
        @keyframes actionButtonSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        style={buttonStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isLoading ? (
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "999px",
              border: `1.5px solid ${hexToRgba(T.accentBright, 0.3)}`,
              borderTopColor: T.accentBright,
              animation: "actionButtonSpin 0.85s linear infinite",
            }}
          />
        ) : (
          <span>{icon}</span>
        )}
        <span>{text}</span>
      </button>
    </>
  );
}

export default ActionButton;
