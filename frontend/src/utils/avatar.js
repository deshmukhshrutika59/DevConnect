// frontend/src/utils/avatar.js
export const getAvatarUrl = (avatarUrl, name, BACKEND) => {
    if (avatarUrl?.startsWith("http")) return avatarUrl; // External URL
    if (avatarUrl)
      return `${BACKEND}${
        avatarUrl.startsWith("/") ? avatarUrl : "/uploads/" + avatarUrl
      }`;
    // fallback avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}`;
  };
  