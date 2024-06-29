import React from "react";
import "./Modal.css";

const Modal = ({ onClose, children, buttonText = "닫기" }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {children}
      <button onClick={onClose}>{buttonText}</button>
    </div>
  </div>
);

export default Modal;