import { fetchUser } from "@/backend/controllers/user.controller";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

async function page() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const primaryEmail = user.emailAddresses.find(
    email => email.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!primaryEmail) {
    return <div>Email address required</div>;
  }

  const userData = {
    userId: user.id,
    username: user.username || `${user.firstName} ${user.lastName}`,
    email: primaryEmail,
    bio: "",
    profilePhoto: user.imageUrl,
  };

  try {
    const userInfo = await fetchUser(user.id, userData);
    if (userInfo.auth) redirect("/");

    const userDataForFrontend = {
      userId: user.id,
      username: userInfo?.username || user.username,
      email: userInfo?.email || userData.email,
      bio: userInfo?.bio || "",
      image: userInfo?.profilePhoto || user.imageUrl,
    };

    return (
      <div>
        <h1>Welcome {userDataForFrontend.username}</h1>
        <pre>{JSON.stringify(userDataForFrontend, null, 2)}</pre>
      </div>
    );
  } catch (error) {
    console.error("Page Error", error);
    return <div>Error loading user data</div>;
  }
}
export default page;
