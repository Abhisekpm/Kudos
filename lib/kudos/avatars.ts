const PLAYER_AVATARS: Record<string, string> = {
  Kashi: "/avatars/kashi.png",
  Eshaan: "/avatars/eshaan.png",
  Nupur: "/avatars/nupur.png",
  Abhishek: "/avatars/abhishek.png",
};

export function avatarForPlayer(playerName: string) {
  return PLAYER_AVATARS[playerName];
}
