import { useState } from "react";
import { FiTag, FiX } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import "./DiscountCodeField.css";

function DiscountCodeField() {
  const { discountCode, discountAmount, discountMessage, applyDiscountCode, removeDiscountCode } = useCart();
  const [code, setCode] = useState(discountCode);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = applyDiscountCode(code);
    setFeedback(result.message);
    setFeedbackType(result.valid ? "success" : "error");
  };

  const remove = () => {
    removeDiscountCode();
    setCode("");
    setFeedback("Discount code removed.");
    setFeedbackType("success");
  };

  const statusMessage = discountCode && !discountAmount && discountMessage
    ? discountMessage
    : feedback;
  const statusType = discountCode && !discountAmount && discountMessage
    ? "error"
    : feedbackType;

  return (
    <div className="discount-code-box">
      <form className="discount-code-form" onSubmit={submit}>
        <label htmlFor="discount-code-input"><FiTag aria-hidden="true" /> Discount code</label>
        <div className="discount-code-form__controls">
          <input
            id="discount-code-input"
            type="text"
            value={code}
            onChange={(event) => { setCode(event.target.value); setFeedback(""); setFeedbackType(""); }}
            placeholder="Enter code"
            autoComplete="off"
            aria-describedby={statusMessage ? "discount-code-status" : undefined}
          />
          {discountCode && code.trim().toUpperCase() === discountCode ? (
            <button className="discount-code-remove" type="button" onClick={remove} aria-label="Remove discount code"><FiX aria-hidden="true" /></button>
          ) : (
            <button type="submit">Apply</button>
          )}
        </div>
        {statusMessage && <p id="discount-code-status" className={`discount-code-status is-${statusType || "success"}`} role={statusType === "error" ? "alert" : "status"}>{statusMessage}</p>}
      </form>
    </div>
  );
}

export default DiscountCodeField;
