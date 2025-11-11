import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, accessToken } = await request.json();

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: "Missing userId or accessToken" },
        { status: 400 }
      );
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !botToken) {
      console.error("Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Add user to Discord guild using the Discord API
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      }
    );

    if (response.ok || response.status === 204) {
      return NextResponse.json({
        success: true,
        message: "User added to Discord server",
      });
    }

    // User might already be in the server
    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: "User already in server",
      });
    }

    const errorData = await response.json().catch(() => ({}));
    console.error("Discord API error:", response.status, errorData);

    return NextResponse.json(
      {
        error: "Failed to add user to Discord server",
        details: errorData,
      },
      { status: response.status }
    );
  } catch (error) {
    console.error("Error adding user to Discord guild:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
