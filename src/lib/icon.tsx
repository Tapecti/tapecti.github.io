import { ImageResponse } from "next/og";
import { profile } from "@/config/profile";
import { getProfileData } from "./profile-data";

/**
 * Every site icon: my Roblox headshot on the light avatar stage, where a dark
 * avatar still reads at 16px. Drawn at build time so it follows the avatar; the
 * initial stands in if Roblox doesn't answer.
 */
export async function renderIcon(size: number, radius: number): Promise<ImageResponse> {
  const { user } = await getProfileData();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius,
          background: "#e3e6ea",
          color: "#101216",
          fontSize: size * 0.62,
          fontWeight: 700,
        }}
      >
        {user?.headshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.headshot} width={size * 1.08} height={size * 1.08} alt="" />
        ) : (
          profile.displayName.slice(0, 1)
        )}
      </div>
    ),
    { width: size, height: size },
  );
}

/** A .ico can carry a PNG as-is: a 6-byte header and one 16-byte directory entry in front of it. */
export async function renderIco(size: number, radius: number): Promise<ArrayBuffer> {
  const png = new Uint8Array(await (await renderIcon(size, radius)).arrayBuffer());
  const head = new DataView(new ArrayBuffer(22));
  head.setUint16(2, 1, true);
  head.setUint16(4, 1, true);
  head.setUint8(6, size);
  head.setUint8(7, size);
  head.setUint16(10, 1, true);
  head.setUint16(12, 32, true);
  head.setUint32(14, png.length, true);
  head.setUint32(18, 22, true);
  const ico = new Uint8Array(new ArrayBuffer(22 + png.length));
  ico.set(new Uint8Array(head.buffer), 0);
  ico.set(png, 22);
  return ico.buffer;
}
