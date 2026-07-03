const AVATAR_GRADIENTS = [
  'from-blue-400 to-indigo-600',
  'from-violet-400 to-purple-600',
  'from-teal-400 to-emerald-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
];

function avatarGradient(index: number) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
}