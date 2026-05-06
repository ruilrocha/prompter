/** Returns today's date in YYYY-MM-DD format (UTC). */
export function getTodayDate(): string {
	return new Date().toISOString().split("T")[0];
}

/** Returns tomorrow's date in YYYY-MM-DD format (UTC). */
export function getTomorrowDate(): string {
	const tomorrow = new Date();
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	return tomorrow.toISOString().split("T")[0];
}
