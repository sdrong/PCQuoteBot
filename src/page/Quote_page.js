import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import LoadingOverlay from "./LoadingOverlay";
import Modal from "./Modal";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [quoteInputText, setQuoteInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const chatContainerRef = useRef(null);

  const toggleQuoteSelection = (quote) => {
    if (selectedQuotes.includes(quote)) {
      setSelectedQuotes(selectedQuotes.filter((q) => q !== quote));
    } else if (selectedQuotes.length < 2) {
      setSelectedQuotes([...selectedQuotes, quote]);
    }
  };

  useEffect(() => {
    const storedQuotes = localStorage.getItem("quoteHistory");
    if (storedQuotes) {
      setPreviousQuotes(JSON.parse(storedQuotes));
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (e.target.value.trim() !== "") {
      setErrorMessage("");
    }
  };

  const handleQuoteInputChange = (e) => {
    setQuoteInputText(e.target.value);
    if (e.target.value.trim() !== "") {
      setErrorMessage("");
    }
  };

  const handleSubmit = async () => {
    if (inputText.trim() === "") {
      setErrorMessage("채팅을 입력해주세요.");
      return;
    }
    setErrorMessage("");

    setLoading(true);

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
      newChatLog.push({ type: "bot", text: formatData(data) });
      setChatLog(newChatLog);

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
    } finally {
      setLoading(false);
    }
  };

  const toggleShowQuotes = () => {
    setShowAllQuotes(!showAllQuotes);
  };

  const fetchQuotes = async () => {
    if (quoteInputText.trim() === "") {
      setErrorMessage("견적 요청을 입력하세요.");
      return;
    }
    setErrorMessage("");

    setLoading(true);

    setChatLog([]);
    setQuoteData(null);
    setSessionId(null);
    setSelectedQuoteDetails(null);
    setFirstData(quoteInputText);
    const newChatLog = [...chatLog, { type: "user", text: quoteInputText }];
    setChatLog(newChatLog);
    setQuoteInputText("");
    try {
      const response = await axios.post("http://localhost:5001/get-quotes", {
        origin_text: quoteInputText,
      });

      if (response.data.length === 0) {
        setAlertModalVisible(true);
      } else {
        setQuoteList(response.data);
      }

      setChatLog(newChatLog);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = async () => {
    if (selectedQuotes.length === 1) {
      const quote = selectedQuotes[0];
      const newChatLog = [
        ...chatLog,
        { type: "bot", text: "견적을 분석 후 추천 이유를 추출 중..." },
      ];
      setChatLog(newChatLog);

      setLoading(true);
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
        newChatLog.push({ type: "bot", text: formatData(data) });
        setChatLog(newChatLog);
        console.log(newChatLog);
        if (Object.keys(quoteDetails).length > 2) {
          setQuoteData(quoteDetails);
          const newQuotes = [...previousQuotes, quoteDetails];
          setPreviousQuotes(newQuotes);
          localStorage.setItem("quoteHistory", JSON.stringify(newQuotes));
        }
        setSelectedQuoteDetails(response);
      } catch (error) {
        console.error("Error fetching quote details:", error);
      } finally {
        setLoading(false);
      }
    } else {
      const quote1 = JSON.stringify(selectedQuotes[0]);
      const quote2 = JSON.stringify(selectedQuotes[1]);
      const newChatLog = [
        ...chatLog,
        { type: "bot", text: "견적을 비교 중..." },
      ];
      setChatLog(newChatLog);

      setLoading(true);
      try {
        const response = await axios.post(
          "http://localhost:5001/compare_quote",
          {
            text: firstData,
            data1: quote1,
            data2: quote2,
          }
        );
        const data = response.data;
        const answer = data["data"];
        newChatLog.push({ type: "bot", text: formatData(answer) });
        setChatLog(newChatLog);
        setSelectedQuotes([]);
      } catch (error) {
        console.error("compare error", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (document.activeElement.id === "quoteInput") {
        fetchQuotes();
      } else if (document.activeElement.id === "chatInput") {
        handleSubmit();
      }
    }
  };

  const formatData = (data) => {
    return data
      .replace(/### /g, "<h3>") // ###를 <h3>로 변환
      .replace(/###/g, "</h3>") // ### 닫기
      .replace(/\*\*([^*]+)\*\*/g, "$1") // **를 제거 (강조 없음)
      .replace(/(?:\r\n|\r|\n)/g, "<br />") // 줄바꿈을 <br>로 변환
      .replace(/1\.\s/g, "<h4>1. ") // 숫자 목록을 <h4>로 변환
      .replace(/2\.\s/g, "<h4>2. ")
      .replace(/3\.\s/g, "<h4>3. ")
      .replace(/4\.\s/g, "<h4>4. ")
      .replace(/5\.\s/g, "<h4>5. ")
      .replace(/6\.\s/g, "<h4>6. ")
      .replace(/7\.\s/g, "<h4>7. ")
      .replace(/8\.\s/g, "<h4>8. ")
      .replace(/9\.\s/g, "<h4>9. ")
      .replace(/(<h4>.*?\d\.\s.*?)(<br \/>)/g, "$1</h4><p>") // <h4> 닫기와 <p> 시작
      .replace(/(<br \/>)(\d\.\s)/g, "</p><h4>") // <h4> 시작
      .concat("</p>"); // 마지막 <p> 닫기
  };

  return (
    <div className="app-container">
      {modalVisible && (
        <Modal onClose={() => setModalVisible(false)}>
          <h1>사용 설명서</h1>
          <h4>1. 처음에 견적을 추천받으세요.(자세한 용도를 적어주세요.)</h4>
          <h4>
            2. 여러 견적 중에 선택해서 비교 버튼을 눌러서 두 견적을
            비교해보세요.
          </h4>
          <h4>
            3. 마음에 드는 견적을 하나 골라서 견적추천이유를 듣고 실시간 컴퓨터
            견적 상담을 경험해보세요.
          </h4>
          <h4>
            4. 추천 받은 견적 , 선택한 견적, 이전 견적 기록을 확인할 수
            있습니다.
          </h4>
        </Modal>
      )}
      {alertModalVisible && (
        <Modal onClose={() => setAlertModalVisible(false)} buttonText="확인">
          <h2>알림</h2>
          <p>
            요청하신 견적사항에 대해서는 저희 컴퓨터 견적을 포함하고 있지
            않습니다.
          </p>
        </Modal>
      )}
      {loading && <LoadingOverlay message="  분석 중..." />}
      <div className="quote-request">
        <input
          id="quoteInput"
          type="text"
          value={quoteInputText}
          onChange={handleQuoteInputChange}
          onKeyPress={handleKeyPress}
          placeholder="견적 요청을 입력하세요"
        />
        <button onClick={fetchQuotes}>견적 추천받기</button>
      </div>
      <div className="chat-section">
        <div className="chat-messages" ref={chatContainerRef}>
          {chatLog.map((entry, index) => (
            <div key={index} className={`chat-message ${entry.type}`}>
              <div
                className={`message-icon ${
                  entry.type === "user" ? "user-icon" : "bot-icon"
                }`}
              >
                {entry.type === "user" ? "👤" : "🤖"}
              </div>
              <div
                className={`message-content ${entry.type}`}
                dangerouslySetInnerHTML={{ __html: entry.text }}
              ></div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            id="chatInput"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              sessionId ? "채팅을 입력하세요" : "견적을 먼저 추천받으세요"
            }
            disabled={!sessionId}
          />
          <button onClick={handleSubmit} disabled={!sessionId}>
            보내기
          </button>
        </div>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
      <div className="quote-sections">
        <div className="quote-section">
          <div className="dis2">
            <h1>추천 받은 견적 목록</h1>
            <button onClick={handleSelectQuote} className="select-button">
              {selectedQuotes.length === 2 ? "비교" : "선택"}
            </button>
          </div>

          {quoteList.length > 0 ? (
            quoteList.map((quote, index) => (
              <div
                key={index}
                className={`quote-card ${
                  selectedQuotes.includes(quote) ? "selected" : ""
                }`}
                onClick={() => toggleQuoteSelection(quote)}
              >
                <h2>견적 {index + 1}</h2>
                <p>
                  <h3>CPU</h3>
                  <strong>
                    제품명 - {quote.parts_price?.CPU?.제품명 ?? "N/A"}
                  </strong>
                  <br />
                  <strong>
                    가격 - {quote.parts_price?.CPU?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>메인보드</h3>
                  <strong>
                    제품명 - {quote.parts_price?.메인보드?.제품명 ?? "N/A"}
                  </strong>
                  <br />
                  <strong>
                    가격 - {quote.parts_price?.메인보드?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>메모리</h3>
                  <strong>
                    제품명 - {quote.parts_price?.메모리?.제품명 ?? "N/A"}
                    <br />
                    가격 - {quote.parts_price?.메모리?.가격 ?? "N/A"}
                    <br />
                    수량 - {quote.parts_price?.메모리?.수량 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>그래픽 카드</h3>
                  <strong>
                    제품명 - {quote.parts_price?.그래픽카드?.제품명 ?? "N/A"}
                    <br />
                    가격 - {quote.parts_price?.그래픽카드?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>SSD</h3> 제품명 -{" "}
                  <strong>
                    {quote.parts_price?.SSD?.제품명 ?? "N/A"}
                    <br />
                    가격 - {quote.parts_price?.SSD?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>케이스</h3>{" "}
                  <strong>
                    제품명 - {quote.parts_price?.케이스?.제품명 ?? "N/A"}
                    <br />
                    가격 - {quote.parts_price?.케이스?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>파워 서플라이</h3>
                  <strong>
                    {" "}
                    제품명 - {quote.parts_price?.파워서플라이?.제품명 ??
                      "N/A"}{" "}
                    - 가격 - {quote.parts_price?.파워서플라이?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>CPU 쿨러</h3>
                  <strong>
                    {" "}
                    제품명 - {quote.parts_price?.CPU쿨러?.제품명 ?? "N/A"}{" "}
                    <br />
                    가격 - {quote.parts_price?.CPU쿨러?.가격 ?? "N/A"}
                  </strong>
                </p>
                <p>
                  <h3>견적 총 가격</h3>
                  <h3>
                    {quote.total_price
                      ? quote.total_price.toLocaleString() + "원"
                      : "N/A"}
                  </h3>
                </p>
              </div>
            ))
          ) : (
            <p>견적을 추천받으세요.</p>
          )}
        </div>
        <div className="quote-section">
          <h1 className="hstyle">선택한 견적</h1>
          {quoteData ? (
            <div className="quote-card">
              <h3>선택한 견적 상세</h3>
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
                {quoteData.cpu_Cooler?.price ?? "N/A"}
              </p>
              <p>총 가격: {quoteData.total_price}</p>
            </div>
          ) : (
            <>
              <p className="mt-3">견적을 선택하세요.</p>
            </>
          )}
        </div>
        <div className="quote-section">
          <div className="dis2">
            <h1 className="dd">이전 견적 기록</h1>
            <button onClick={toggleShowQuotes} className="show-button">
              {showAllQuotes ? "숨기기" : "더 보기"}
            </button>
          </div>
          <div className="previous-quotes">
            {showAllQuotes &&
              (previousQuotes.length > 0 ? (
                previousQuotes.map((quote, index) => (
                  <div key={index} className="quote-card">
                    <h3>이전 견적 {index + 1}</h3>
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
                      CPU 쿨러: {quote.cpu_Cooler_name} -{" "}
                      {quote.cpu_Cooler?.price ?? "N/A"}
                    </p>
                    <p>총 가격: {quote.total_price}</p>
                  </div>
                ))
              ) : (
                <p>이전 견적이 없습니다.</p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quote_page;
