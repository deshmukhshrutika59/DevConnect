// const BASE_URL = "http://localhost:8000"; // change if hosted
const VITE_RESUME_API_URL = import.meta.env.VITE_RESUME_API_URL;


export async function uploadResumeAndMatchJD(resumeFile, jdText, userId) {
  const formData = new FormData();
  formData.append("resume_file", resumeFile);
  formData.append("jd_text", jdText);
  formData.append("userId", userId);

  const res = await fetch(`${VITE_RESUME_API_URL}/match-custom-jd`, {
    method: "POST",
    body: formData,
  });
  return await res.json();
}

export async function uploadResumeAndMatchTitle(resumeFile, jobTitle, userId) {
  const formData = new FormData();
  formData.append("resume_file", resumeFile);
  formData.append("job_title", jobTitle);
  formData.append("userId", userId);

  const res = await fetch(`${VITE_RESUME_API_URL}/match-job-title`, {
    method: "POST",
    body: formData,
  });
  return await res.json();
}

export async function fetchMatchHistory(userId) {
  const res = await fetch(`${VITE_RESUME_API_URL}/user-matches?userId=${userId}`);
  return await res.json();
}
