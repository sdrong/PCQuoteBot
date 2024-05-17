import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Quote_page.css";

function Quote_page() {
  const [inputText, setInputText] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [quoteData, setQuoteData] = useState(null);
  const [selectedQuoteDetails, setSelectedQuoteDetails] = useState(null);
  const [quoteList, setQuoteList] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [previousQuotes, setPreviousQuotes] = useState([]);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [firstData, setFirstData] = useState("");
  const [selectedQuotes, setSelectedQuotes] = useState([]);

  const chatContainerRef = useRef(null);
  // select 체크박스를 위함
  const toggleQuoteSelection = (quote) => {
    if (selectedQuotes.includes(quote)) {
      setSelectedQuotes(selectedQuotes.filter((q) => q !== quote)); // 견적 선택 해제
    } else if (selectedQuotes.length < 2) {
      setSelectedQuotes([...selectedQuotes, quote]); // 견적 선택
    }
  };

  useEffect(() => {
    const storedQuotes = localStorage.getItem("quoteHistory");
    if (storedQuotes) {
      setPreviousQuotes(JSON.parse(storedQuotes));
    }
  }, []);
  // 채팅 스크롤 위치관련인데 견적 질문떄만 됨 ㅋㅌ
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleInputChange = (e) => setInputText(e.target.value);

  //일반적인 LLM호출
  const handleSubmit = async () => {
    const newChatLog = [...chatLog, { type: "user", text: inputText }];
    setChatLog(newChatLog);
    setInputText("");

    try {
      const response = await axios.post("http://localhost:5001/get-response", {
        origin_text: inputText,
        session_id: sessionId,
      });
      const { data, session_id, ...quoteDetails } = response.data;

      setSessionId(session_id);
      newChatLog.push({ type: "bot", text: data });
      setChatLog(newChatLog);
      //이전 견적 기록
      if (Object.keys(quoteDetails).length > 2) {
        setQuoteData(quoteDetails);
        const newQuotes = [...previousQuotes, quoteDetails];
        setPreviousQuotes(newQuotes);
        localStorage.setItem("quoteHistory", JSON.stringify(newQuotes));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      newChatLog.push({ type: "bot", text: "서버 오류가 발생했습니다." });
      setChatLog(newChatLog);
    }
  };
  //더보기
  const toggleShowQuotes = () => {
    setShowAllQuotes(!showAllQuotes);
  };
  //견적 추천 받는것
  const fetchQuotes = async () => {
    setChatLog([]);
    setQuoteData(null);
    setSessionId(null);
    setSelectedQuoteDetails(null);
    setFirstData(inputText);
    const newChatLog = [...chatLog, { type: "user", text: inputText }];
    setChatLog(newChatLog);
    setInputText("");
    try {
      const response = await axios.post("http://localhost:5001/get-quotes", {
        origin_text: inputText,
      });
      setQuoteList(response.data);
      setChatLog(newChatLog);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }
  };
  //추천 견적 중 선택
  const handleSelectQuote = async () => {
    if (selectedQuotes.length === 1) {
      const quote = selectedQuotes[0];
      console.log("Selected quote data:", quote);
      const newChatLog = [...chatLog, { type: "user", text: inputText }];
      try {
        const response = await axios.post(
          "http://localhost:5001/get-quote-detail",
          {
            quotes: quote,
            text: firstData,
          }
        );
        const { data, session_id, ...quoteDetails } = response.data;
        setQuoteList([]);
        setSelectedQuotes([]);
        setSessionId(session_id);
        newChatLog.push({ type: "bot", text: data });
        setChatLog(newChatLog);

        if (Object.keys(quoteDetails).length > 2) {
          setQuoteData(quoteDetails);
          const newQuotes = [...previousQuotes, quoteDetails];
          setPreviousQuotes(newQuotes);
          localStorage.setItem("quoteHistory", JSON.stringify(newQuotes));
        }
        setSelectedQuoteDetails(response);
      } catch (error) {
        console.error("Error fetching quote details:", error);
      }
    } else {
      const quote1 = JSON.stringify(selectedQuotes[0]);
      const quote2 = JSON.stringify(selectedQuotes[1]);
      console.log("Selected quote data:", quote1);
      console.log("Selected quote data:", quote2);

      try {
        const response = await axios.post(
          "http://localhost:5001/compare_quote",
          {
            data1: quote1,
            data2: quote2,
          }
        );
        const data = response.data;
        const answer = data["data"];
        const newChatLog = [...chatLog];
        newChatLog.push({ type: "bot", text: answer });
        setChatLog(newChatLog);
        setSelectedQuotes([]);
      } catch (error) {
        console.error("compare error", error);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="chat-section">
        {chatLog.map((entry, index) => (
          <div key={index} className={`chat-message ${entry.type}`}>
            {entry.text}
          </div>
        ))}
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="질문을 입력하세요"
        />
        <button onClick={handleSubmit}>보내기</button>
        <button onClick={fetchQuotes}>견적 추천 받기</button>
      </div>
      <div className="quote-section">
        {quoteList.length > 0 && (
          <div>
            <h2>Available Quotes</h2>
            {quoteList.map((quote, index) => (
              <div key={index}>
                <p>
                  제품명: {quote.parts_price.CPU.제품명} - 가격:{" "}
                  {quote.parts_price.CPU.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.메인보드.제품명} - 가격:{" "}
                  {quote.parts_price.메인보드.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.메모리.제품명} - 가격:{" "}
                  {quote.parts_price.메모리.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.그래픽카드.제품명} - 가격:{" "}
                  {quote.parts_price.그래픽카드.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.SSD.제품명} - 가격:{" "}
                  {quote.parts_price.SSD.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.케이스.제품명} - 가격:{" "}
                  {quote.parts_price.케이스.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.파워서플라이.제품명} - 가격:{" "}
                  {quote.parts_price.파워서플라이.가격}
                </p>
                <p>
                  제품명: {quote.parts_price.CPU쿨러.제품명} - 가격:{" "}
                  {quote.parts_price.CPU쿨러.가격}
                </p>
                <p>Total Price: {quote.total_price}</p>
                <input
                  type="checkbox"
                  checked={selectedQuotes.includes(quote)}
                  onChange={() => toggleQuoteSelection(quote)}
                />{" "}
                Select
                <br />
              </div>
            ))}
            <button
              onClick={handleSelectQuote}
              disabled={selectedQuotes.length === 0}
            >
              선택
            </button>
          </div>
        )}
        {selectedQuoteDetails && (
          <div>
            <h2>Selected Quote Details</h2>
            <p>{selectedQuoteDetails.quote_description}</p>
          </div>
        )}
      </div>
      <div className="quote-section">
        {quoteData && (
          <div>
            <h1>견적 상세</h1>
            <p>
              CPU: {quoteData.cpu_name} - {quoteData.cpu_price}
            </p>
            <p>
              메인보드: {quoteData.mother_name} - {quoteData.mother_price}
            </p>
            <p>
              메모리: {quoteData.memory_name} - {quoteData.memory_price}
            </p>
            <p>
              그래픽 카드: {quoteData.gpu_name} - {quoteData.gpu_price}
            </p>
            <p>
              SSD: {quoteData.ssd_name} - {quoteData.ssd_price}
            </p>
            <p>
              케이스: {quoteData.case_name} - {quoteData.case_price}
            </p>
            <p>
              파워 서플라이: {quoteData.power_name} - {quoteData.power_price}
            </p>
            <p>
              CPU 쿨러: {quoteData.cpu_Cooler_name} -{" "}
              {quoteData.cpu_Cooler_price}
            </p>
            <p>총 가격: {quoteData.total_price}</p>
          </div>
        )}
        {previousQuotes.length > 1 && (
          <div>
            <h2>이전 견적 기록</h2>
            {previousQuotes
              .slice(1, showAllQuotes ? undefined : 2)
              .map((quote, index) => (
                <div key={index}>
                  <p>index: {index + 1}</p>
                  <p>
                    CPU: {quote.cpu_name} - {quote.cpu_price}
                  </p>
                  <p>
                    메인보드: {quote.mother_name} - {quote.mother_price}
                  </p>
                  <p>
                    메모리: {quote.memory_name} - {quote.memory_price}
                  </p>
                  <p>
                    그래픽 카드: {quote.gpu_name} - {quote.gpu_price}
                  </p>
                  <p>
                    SSD: {quote.ssd_name} - {quote.ssd_price}
                  </p>
                  <p>
                    케이스: {quote.case_name} - {quote.case_price}
                  </p>
                  <p>
                    파워 서플라이: {quote.power_name} - {quote.power_price}
                  </p>
                  <p>
                    CPU 쿨러: {quote.cpu_Cooler_name} - {quote.cpu_Cooler_price}
                  </p>
                  <p>총 가격: {quote.total_price}</p>
                </div>
              ))}
            {previousQuotes.length > 2 && (
              <button onClick={toggleShowQuotes}>
                {showAllQuotes ? "숨기기" : "더 보기"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default Quote_page;
