import test from "node:test";
import assert from "node:assert/strict";
import {
  createPost,
  searchPosts,
  assignOwner,
  confirmHandover,
} from "./campusfind.js";

function samplePost(overrides = {}) {
  return createPost({
    title: "Хар цүнх",
    description: "Номын санд олдсон жижиг цүнх",
    category: "Цүнх",
    location: "Номын сан",
    finderId: "finder-1",
    ...overrides,
  });
}

function assignedPost() {
  const post = samplePost();
  assignOwner(post, "finder-1", "owner-1");
  return post;
}

test("New found post is active", () => {
  const post = samplePost();
  assert.equal(post.type, "FOUND");
  assert.equal(post.status, "ACTIVE");
  assert.equal(post.ownerId, null);
  assert.ok(post.id);
});

test("Blank title is rejected", () => {
  assert.throws(() => samplePost({ title: "   " }), /title is required/);
});

test("Search finds title", () => {
  const post = samplePost();
  assert.deepEqual(searchPosts([post], "цүнх"), [post]);
});

test("Search finds description", () => {
  const post = samplePost();
  assert.deepEqual(searchPosts([post], "жижиг"), [post]);
});

test("Search ignores case and surrounding spaces", () => {
  const post = samplePost();
  assert.deepEqual(searchPosts([post], "  ХАР  "), [post]);
});

test("Closed posts are excluded from search", () => {
  const post = assignedPost();
  confirmHandover(post, "finder-1");
  confirmHandover(post, "owner-1");
  assert.deepEqual(searchPosts([post], "цүнх"), []);
});

test("Only finder can assign owner", () => {
  const post = samplePost();
  assert.throws(
    () => assignOwner(post, "other-1", "owner-1"),
    /Only the finder/,
  );
  assert.equal(post.ownerId, null);
});

test("Finder cannot become owner of the same post", () => {
  const post = samplePost();
  assert.throws(
    () => assignOwner(post, "finder-1", "finder-1"),
    /different users/,
  );
});

test("Assigned owner cannot be replaced", () => {
  const post = assignedPost();
  assert.throws(
    () => assignOwner(post, "finder-1", "owner-2"),
    /already assigned/,
  );
  assert.equal(post.ownerId, "owner-1");
});

test("Confirmation requires assigned owner", () => {
  const post = samplePost();
  assert.throws(() => confirmHandover(post, "finder-1"), /assigned first/);
});

test("Unrelated user cannot confirm handover", () => {
  const post = assignedPost();
  assert.throws(
    () => confirmHandover(post, "other-1"),
    /Only the finder or owner/,
  );
  assert.deepEqual(post.confirmations, { finder: false, owner: false });
});

test("One confirmation keeps post active", () => {
  const post = assignedPost();
  confirmHandover(post, "finder-1");
  assert.equal(post.status, "ACTIVE");
});

test("Two confirmations close post", () => {
  const post = assignedPost();
  confirmHandover(post, "finder-1");
  confirmHandover(post, "owner-1");
  assert.equal(post.status, "CLOSED");
});

test("Owner may confirm before finder", () => {
  const post = assignedPost();
  confirmHandover(post, "owner-1");
  assert.equal(post.status, "ACTIVE");
  confirmHandover(post, "finder-1");
  assert.equal(post.status, "CLOSED");
});

test("Repeated finder confirmation does not close post", () => {
  const post = assignedPost();
  confirmHandover(post, "finder-1");
  confirmHandover(post, "finder-1");
  assert.equal(post.status, "ACTIVE");
  assert.equal(post.confirmations.owner, false);
});
