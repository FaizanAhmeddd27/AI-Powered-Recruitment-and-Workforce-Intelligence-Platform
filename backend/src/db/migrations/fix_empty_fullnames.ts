import { query } from "../../config/db";
import logger from "../../utils/logger.utils";

/**
 * Fix existing users with empty or null full_name values
 * Sets full_name to email username if empty
 */
export async function fixEmptyFullNames() {
  try {
    logger.info("🔧 Checking for users with empty full_name...");

    // Find users with null or empty full_name
    const usersToFix = await query(`
      SELECT id, email, full_name, auth_provider 
      FROM users 
      WHERE full_name IS NULL OR TRIM(full_name) = ''
    `);

    if (usersToFix.rows.length === 0) {
      logger.info("✅ No users with empty full_name found");
      return;
    }

    logger.info(`Found ${usersToFix.rows.length} users with empty full_name`);

    // Update each user
    for (const user of usersToFix.rows) {
      const emailUsername = user.email.split("@")[0];
      
      await query(
        `UPDATE users SET full_name = $1 WHERE id = $2`,
        [emailUsername, user.id]
      );

      logger.info(`✅ Updated user ${user.email} - set full_name to "${emailUsername}"`);
    }

    logger.info(`✅ Fixed ${usersToFix.rows.length} users with empty full_name`);
  } catch (error) {
    logger.error(`❌ Error fixing empty full_names: ${error}`);
    throw error;
  }
}
