import { randomUUID } from "node:crypto";

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function requireActive(post) {
  if (post.status !== "ACTIVE") {
    throw new Error("Post is closed");
  }
}

export function createPost(input) {
  return {
    id: randomUUID(),
    title: requiredText(input.title, "title"),
    description: requiredText(input.description, "description"),
    category: requiredText(input.category, "category"),
    location: requiredText(input.location, "location"),
    finderId: requiredText(input.finderId, "finderId"),
    ownerId: null,
    type: "FOUND",
    status: "ACTIVE",
    confirmations: { finder: false, owner: false },
  };
}

export function searchPosts(posts, keyword = "") {
  const query = keyword.trim().toLocaleLowerCase("mn");
  return posts.filter((post) => {
    const content = `${post.title} ${post.description}`.toLocaleLowerCase("mn");
    return post.status === "ACTIVE" && content.includes(query);
  });
}

export function assignOwner(post, actorId, ownerId) {
  requireActive(post);
  if (actorId !== post.finderId) {
    throw new Error("Only the finder can assign the owner");
  }
  const candidate = requiredText(ownerId, "ownerId");
  if (candidate === post.finderId) {
    throw new Error("Finder and owner must be different users");
  }
  if (post.ownerId && post.ownerId !== candidate) {
    throw new Error("Owner is already assigned");
  }
  post.ownerId = candidate;
  return post;
}

export function confirmHandover(post, actorId) {
  requireActive(post);
  if (!post.ownerId) {
    throw new Error("Owner must be assigned first");
  }
  if (actorId === post.finderId) {
    post.confirmations.finder = true;
  } else if (actorId === post.ownerId) {
    post.confirmations.owner = true;
  } else {
    throw new Error("Only the finder or owner can confirm");
  }
  if (post.confirmations.finder && post.confirmations.owner) {
    post.status = "CLOSED";
  }
  return post;
}
