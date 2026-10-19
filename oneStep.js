const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const {
  TELEGRAM_BOT_TOKEN,
  API_BASE_URL,
  FRONTEND_URL,
  WEBAPP_URL,
} = require("./config");
// const photo = fs.readFileSync(path.resolve(__dirname, "photo.png"));

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 100,
    autoStart: true,
    params: { timeout: 10 },
  },
});

// Handle '/start' command
bot.onText(/\/start/, async (msg) => {
  console.log("/start");

  const userId = msg.from.id.toString();
  const chatId = msg.chat.id;
  const fullname = msg.from.username;
  console.log(fullname, chatId, userId);

  try {
    console.log("A");

    const response = await axios.post(`${API_BASE_URL}/check`, {
      name: userId,
      fullname: fullname,
    });
    console.log(response);

    if (response.status === 200) {
      console.log("B");

      await loginUser(chatId, userId);
    } else {
      console.log("C");

      await registerUser(chatId, userId, fullname);
    }
  } catch (error) {
    if (
      error.response &&
      (error.response.status === 404 || error.response.status === 500)
    ) {
      console.log("F");

      await registerUser(chatId, userId, fullname);
    } else {
      console.error("Error during /start process:", error.message);
      bot.sendMessage(chatId, "Something went wrong! Please try again later.");
    }
  }
});

// Handle polling errors
bot.on("polling_error", (error) => {
  console.error(`[polling_error] ${error.code}: ${error.message}`);
});

// Register User
async function registerUser(chatId, userId, fullname) {
  try {
    console.log("D");
    console.log("D", chatId, userId, fullname);

    const response = await axios.post(`${API_BASE_URL}/register`, {
      name: userId,
      fullname: fullname,
    });
    console.log("D", response.status);

    if (response.status === 201) {
      console.log("G");

      await loginUser(chatId, userId);
    }
  } catch (error) {
    console.error("Registration failed:", error.message);
    bot.sendMessage(chatId, "Registration failed! Please try again later.");
  }
}

// Login User
async function loginUser(chatId, userId) {
  console.log("E");

  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      name: userId,
    });

    const token = response.data.token;

    const gameDescription = `Earn real money with Adsvilla by completing tasks, playing games, taking surveys, and watching ads plus free Airdrop.\n\n Minimum withdrawal as little as $1 USDT!`;

    const options = {
      caption: gameDescription, // Set the caption for the photo
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎁 Play in one Click 🎁",
              web_app: { url: `${FRONTEND_URL}?startapp=${token}` },
            },
          ],
          [
            {
              text: "🌐 Create account on Adsvilla 🌐",
              url: `https://adsvilla.net/signup.php`,
            },
          ],
          [
            {
              text: "📢 Join our Telegram channel 📢",
              url: `https://t.me/advillage`,
            },
          ],
          [{ text: "🐦 Follow us on X 🐦", url: `https://x.com/adsvillanet` }],
          [
            {
              text: "🪐 Subscribe to our YouTube Channel 🪐",
              url: `https://youtube.com/@adsvillaofficial`,
            },
          ],
        ],
      },
    };

    bot.sendPhoto(chatId, "photo.png", options); // Pass options directly
  } catch (error) {
    console.error("Login failed:", error.message);
    bot.sendMessage(chatId, "Login failed! Please try again later.");
  }
}
