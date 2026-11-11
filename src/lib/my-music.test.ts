import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanLink, detectPlatform, oembedUrl, titleFromFileName } from "./my-music.ts";

test("links pasted from a share sheet are cleaned; unsafe or empty input is refused", () => {
  assert.equal(cleanLink("Check this out! https://open.spotify.com/playlist/abc?si=1"), "https://open.spotify.com/playlist/abc?si=1");
  assert.equal(cleanLink("open.spotify.com/playlist/abc"), "https://open.spotify.com/playlist/abc");
  assert.equal(cleanLink("http://www.jiosaavn.com/featured/x"), "https://www.jiosaavn.com/featured/x");
  assert.equal(cleanLink("javascript:alert(1)"), null);
  assert.equal(cleanLink("hello"), null);
  assert.equal(cleanLink(""), null);
});

test("platforms are recognised from the address", () => {
  assert.equal(detectPlatform("https://open.spotify.com/track/1"), "spotify");
  assert.equal(detectPlatform("https://spotify.link/xyz"), "spotify");
  assert.equal(detectPlatform("https://music.youtube.com/playlist?list=1"), "ytmusic");
  assert.equal(detectPlatform("https://youtu.be/abc"), "youtube");
  assert.equal(detectPlatform("https://www.jiosaavn.com/song/x"), "jiosaavn");
  assert.equal(detectPlatform("https://music.apple.com/in/album/x"), "apple");
  assert.equal(detectPlatform("https://example.com/x"), "other");
});

test("oEmbed is used only where a public title lookup exists", () => {
  assert.match(oembedUrl("https://open.spotify.com/track/1")!, /^https:\/\/open\.spotify\.com\/oembed\?url=/);
  assert.match(oembedUrl("https://music.youtube.com/watch?v=abc")!, /www\.youtube\.com%2Fwatch/);
  assert.equal(oembedUrl("https://www.jiosaavn.com/song/x"), null);
});

test("file names become readable titles", () => {
  assert.equal(titleFromFileName("02 - Arijit Singh - Tum Hi Ho (128kbps).mp3"), "Arijit Singh - Tum Hi Ho");
  assert.equal(titleFromFileName("rain_sounds_long.m4a"), "rain sounds long");
  assert.equal(titleFromFileName(".mp3"), "My track");
});
