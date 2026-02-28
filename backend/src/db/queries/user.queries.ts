export const UserQueries = {
  // CREATE
  createUser: `
    INSERT INTO users (email, password_hash, full_name, role, auth_provider, provider_id, avatar_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email, full_name, role, auth_provider, avatar_url, is_active, is_verified, profile_completion, created_at
  `,

  createCandidateProfile: `
    INSERT INTO candidate_profiles (user_id)
    VALUES ($1)
    RETURNING *
  `,

  // READ
  findByEmail: `
    SELECT * FROM users WHERE email = $1 AND is_active = TRUE
  `,

  findById: `
    SELECT id, email, full_name, role, auth_provider, avatar_url, phone, location,
           linkedin_url, github_url, portfolio_url, bio, is_active, is_verified,
           resume_mongo_id, parsed_resume_mongo_id, profile_completion, created_at, updated_at
    FROM users WHERE id = $1
  `,

  findByProviderId: `
    SELECT * FROM users WHERE auth_provider = $1 AND provider_id = $2
  `,

  // UPDATE
  updateProfile: `
    UPDATE users 
    SET full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone),
        location = COALESCE($4, location),
        linkedin_url = COALESCE($5, linkedin_url),
        github_url = COALESCE($6, github_url),
        portfolio_url = COALESCE($7, portfolio_url),
        bio = COALESCE($8, bio),
        avatar_url = COALESCE($9, avatar_url)
    WHERE id = $1
    RETURNING id, email, full_name, role, phone, location, linkedin_url, github_url, portfolio_url, bio, avatar_url, profile_completion
  `,

  updateResumeIds: `
    UPDATE users 
    SET resume_mongo_id = $2, parsed_resume_mongo_id = $3
    WHERE id = $1
    RETURNING id
  `,

  updateProfileCompletion: `
    UPDATE users SET profile_completion = $2 WHERE id = $1
  `,

  updateLastLogin: `
    UPDATE users SET last_login_at = NOW() WHERE id = $1
  `,

  // ADMIN
  getAllUsers: `
    SELECT id, email, full_name, role, auth_provider, is_active, is_verified, 
           profile_completion, created_at, last_login_at
    FROM users
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `,

  getUserCount: `
    SELECT COUNT(*) as total FROM users
  `,

  getUserCountByRole: `
    SELECT role, COUNT(*) as count FROM users GROUP BY role
  `,

  deactivateUser: `
    UPDATE users SET is_active = FALSE WHERE id = $1
  `,
};