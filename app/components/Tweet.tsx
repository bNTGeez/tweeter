interface TweetProps {
  tweet: string;
  username: string;
  createdAt: string;
}

export default function Tweet({ tweet, username, createdAt }: TweetProps) {
  return (
    <div>
      <span>{username}</span>
      <span>{createdAt}</span>
      <p>{tweet}</p>
    </div>
  );
}
