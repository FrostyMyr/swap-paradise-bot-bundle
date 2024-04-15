const snoowrap = require("snoowrap");
const axios = require("axios");
const cron = require("node-cron");
require("dotenv").config();

// Reddit API authentication
const reddit = new snoowrap({
  userAgent: process.env.useragent,
  clientId: process.env.clientid,
  clientSecret: process.env.clientsecret,
  username: process.env.username,
  password: process.env.password,
});

// List of subreddits to fetch posts from
const subreddits = {
  AnimePossession:
    "",
  bodyswap:
    "",
  BodySwapRP:
    "",
  AnimalBodySwap:
    "",
};

// Map to store processed post IDs and associated timestamps
const processedPostMap = new Map();
const serverStartTimeUnix = Math.floor(new Date().getTime() / 1000);

// Get Reddit post image URL
async function getRedditPostMediaUrl(post) {
  const rawUrl = post["url_overridden_by_dest"];

  if (rawUrl) {
    if (rawUrl.includes("i.redd.it") || rawUrl.includes("i.imgur.com")) {
      return rawUrl;
    } else if (rawUrl.includes("www.reddit.com/gallery")) {
      const mediaMetadata =
        post["media_metadata"] ||
        post["crosspost_parent_list"][0]["media_metadata"];
      const trueUrl =
        Object.values(mediaMetadata)[0]["s"]["u"] ||
        Object.values(mediaMetadata)[0]["s"]["gif"];
      return trueUrl;
    }
  }

  return "video";
}

// Fetch Reddit posts
async function fetchRedditPosts(subreddit) {
  const currentTime = new Date();

  const webhookUrl = subreddits[subreddit];
  const subredditContents = await reddit.getSubreddit(subreddit);
  const posts = await subredditContents.getNew({ limit: 5 });

  let newPosts;
  if (processedPostMap.get(subreddit)) {
    newPosts = posts.filter(
      (post) => post.created_utc > processedPostMap.get(subreddit),
    );
  } else {
    newPosts = posts.filter((post) => post.created_utc > serverStartTimeUnix);
  }

  for (const post of newPosts.reverse()) {
    await new Promise((resolve) => {
      sendDiscordWebhook(post, webhookUrl);
      processedPostMap.set(subreddit, post.created_utc);

      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  if (newPosts.length > 0) {
    const consoleTime = currentTime.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    // console.count(`Fetched ${newPosts.length} post(s) on ${consoleTime}`);
  }
}

// Send message to Discord webhook
async function sendDiscordWebhook(post, webhookUrl) {
  const subreddit = post.subreddit_name_prefixed;
  const title = truncateText(post.title, 253);
  const content = truncateText(post.selftext, 253);
  const postUrl = `https://www.reddit.com${post.permalink}`;
  const mediaUrl = await getRedditPostMediaUrl(post);
  const flair = post.link_flair_text;
  const postAuthor = post.author.name;

  axios
    .post(webhookUrl, {
      embeds: [
        {
          author: {
            name: subreddit,
          },
          title: title,
          description: content,
          url: postUrl,
          color: "65280",
          fields: [
            ...(flair ? [{ name: flair, value: "", inline: true }] : []),
            {
              name: postAuthor,
              value: "",
              inline: true,
            },
          ],
          ...(mediaUrl != "video" ? { image: { url: mediaUrl } } : {}),
        },
      ],
    })
    .then((embedMessage) => {
      if (post["url_overridden_by_dest"] && mediaUrl == "video") {
        axios
          .post(webhookUrl, {
            content: post["url_overridden_by_dest"],
          })
          .catch((error) =>
            console.log([subreddit, title, error.response.data]),
          );
      }
    })
    .catch((error) => console.log([subreddit, title, error.response.data]));
}

// Truncate long text
function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + "...";
  }
  return text;
}

// Schedule the script to run every 30 minutes
cron.schedule("* * * * *", () => {
  for (const subreddit in subreddits) {
    try {
      fetchRedditPosts(subreddit);
    } catch (error) {
      console.log(error);
    }
  }
});
