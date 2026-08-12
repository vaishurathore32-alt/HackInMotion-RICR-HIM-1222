const API_URL = "http://localhost:5000";

const userId = "demo-user";

const chatContainer =
  document.getElementById("chatContainer");

const questionInput =
  document.getElementById("questionInput");

const sendBtn =
  document.getElementById("sendBtn");

const clearChatBtn =
  document.getElementById("clearChatBtn");

const subjectInput =
  document.getElementById("subject");

const topicInput =
  document.getElementById("topic");

const levelInput =
  document.getElementById("level");

const modeInput =
  document.getElementById("mode");


/*
  Send message
*/

async function sendMessage() {

  const question =
    questionInput.value.trim();

  if (!question) {
    alert("Please enter your question.");
    return;
  }


  const subject =
    subjectInput.value.trim() || "General";

  const topic =
    topicInput.value.trim();

  const level =
    levelInput.value;

  const mode =
    modeInput.value;


  /*
    Remove welcome screen
  */

  const welcome =
    document.querySelector(".welcome");

  if (welcome) {
    welcome.remove();
  }


  /*
    Display user message
  */

  addMessage(
    "user",
    question
  );


  questionInput.value = "";

  showTyping();


  try {

    const response =
      await fetch(`${API_URL}/api/chat`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          userId,

          question,

          subject,

          topic,

          level,

          mode

        })

      });


    const data =
      await response.json();


    hideTyping();


    if (!data.success) {

      addMessage(
        "assistant",
        data.message || "Something went wrong."
      );

      return;
    }


    addMessage(
      "assistant",
      data.answer
    );


  } catch (error) {

    console.error(error);

    hideTyping();

    addMessage(
      "assistant",
      "⚠️ Unable to connect to the AI assistant. Please check that the backend server is running."
    );

  }

}


/*
  Add message to UI
*/

function addMessage(
  sender,
  message
) {

  const messageDiv =
    document.createElement("div");

  messageDiv.className =
    `message ${sender}`;


  const content =
    document.createElement("div");

  content.className =
    "message-content";


  content.textContent =
    message;


  messageDiv.appendChild(content);

  chatContainer.appendChild(messageDiv);


  scrollToBottom();
}


/*
  Typing indicator
*/

function showTyping() {

  const typing =
    document.createElement("div");

  typing.id = "typing";

  typing.className =
    "message assistant";

  typing.innerHTML = `
    <div class="message-content typing">
      🤖 AI is thinking...
    </div>
  `;

  chatContainer.appendChild(typing);

  scrollToBottom();
}


function hideTyping() {

  const typing =
    document.getElementById("typing");

  if (typing) {
    typing.remove();
  }

}


/*
  Scroll chat
*/

function scrollToBottom() {

  chatContainer.scrollTop =
    chatContainer.scrollHeight;

}


/*
  Quick suggestion
*/

function useSuggestion(text) {

  questionInput.value = text;

  questionInput.focus();

}


/*
  Quick action

  Sends a follow-up request based
  on the previous conversation.
*/

function quickAction(action) {

  questionInput.value = action;

  questionInput.focus();

}


/*
  Clear chat
*/

async function clearChat() {

  const confirmed =
    confirm("Clear your chat history?");

  if (!confirmed) {
    return;
  }


  try {

    await fetch(
      `${API_URL}/api/history/${userId}`,
      {
        method: "DELETE"
      }
    );

    chatContainer.innerHTML = `
      <div class="welcome">

        <div class="bot-icon">
          🤖
        </div>

        <h2>
          Chat cleared!
        </h2>

        <p>
          Ask me a new study question.
        </p>

      </div>
    `;

  } catch (error) {

    console.error(error);

    alert("Unable to clear chat.");

  }

}


/*
  Enter = Send
  Shift + Enter = New line
*/

questionInput.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


sendBtn.addEventListener(
  "click",
  sendMessage
);


clearChatBtn.addEventListener(
  "click",
  clearChat
);