import { lostPostSchema } from '@campusfind/contracts';
// Narmandakh: US-04. Keep LOST-specific rules in this directory.
export const validateLostPost = (input: unknown) => lostPostSchema.parse(input);
