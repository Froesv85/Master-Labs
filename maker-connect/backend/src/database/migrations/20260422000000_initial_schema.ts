import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Epic E1: Identity & Profile
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('username', 100).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('display_name', 255);
    table.text('bio');
    table.string('avatar_url', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    table.boolean('lgpd_consent').defaultTo(false);
    table.index('email');
    table.index('username');
    table.index('created_at');
  });

  await knex.schema.createTable('user_profiles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().unique().notNullable();
    table.enum('maker_level', ['apprentice', 'journeyman', 'master']).defaultTo('apprentice');
    table.json('expertise_areas');
    table.text('bio_long');
    table.string('github_url', 255);
    table.string('portfolio_url', 255);
    table.integer('years_of_experience');
    table.integer('total_projects').defaultTo(0);
    table.integer('total_contributions').defaultTo(0);
    table.integer('reputation_score').defaultTo(0);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index('maker_level');
    table.index('reputation_score');
  });

  await knex.schema.createTable('user_badges', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.enum('badge_type', ['first_project', 'first_fork', 'documentation_hero', 'robot_master', 'team_player']).notNullable();
    table.timestamp('earned_at').defaultTo(knex.fn.now());
    table.json('metadata');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['user_id', 'badge_type']);
    table.index(['user_id', 'earned_at']);
  });

  await knex.schema.createTable('user_hardware_stack', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.enum('hardware_category', ['microcontroller', 'sensor', 'motor', 'power', 'wireless', 'mechanical']).notNullable();
    table.string('component_name', 255);
    table.enum('expertise_level', ['beginner', 'intermediate', 'expert']).defaultTo('beginner');
    table.integer('years_used').defaultTo(0);
    table.integer('projects_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['user_id', 'hardware_category']);
  });

  await knex.schema.createTable('user_follows', (table) => {
    table.increments('id').primary();
    table.integer('follower_id').unsigned().notNullable();
    table.integer('following_id').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('follower_id').references('users.id').onDelete('CASCADE');
    table.foreign('following_id').references('users.id').onDelete('CASCADE');
    table.unique(['follower_id', 'following_id']);
    table.index('following_id');
    table.index('follower_id');
  });

  // Epic E2: Feed Social
  await knex.schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('project_id').unsigned();
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.enum('content_type', ['text', 'image', 'video', 'project_update']).defaultTo('text');
    table.json('media_urls');
    table.enum('visibility', ['public', 'followers', 'private']).defaultTo('public');
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('published');
    table.integer('engagement_score').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index('created_at');
    table.index(['user_id', 'status']);
    table.index('engagement_score');
  });

  await knex.schema.createTable('post_comments', (table) => {
    table.increments('id').primary();
    table.integer('post_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('post_id').references('posts.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['post_id', 'created_at']);
    table.index(['user_id', 'created_at']);
  });

  await knex.schema.createTable('post_likes', (table) => {
    table.increments('id').primary();
    table.integer('post_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('post_id').references('posts.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['post_id', 'user_id']);
    table.index('post_id');
    table.index('user_id');
  });

  // Epic E3: Projects & Governance
  await knex.schema.createTable('projects', (table) => {
    table.increments('id').primary();
    table.integer('creator_id').unsigned().notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.enum('category', ['robotics', '3d-printing', 'iot', 'woodworking']).notNullable();
    table.integer('parent_project_id').unsigned();
    table.enum('status', ['draft', 'active', 'archived', 'completed']).defaultTo('draft');
    table.enum('difficulty_level', ['beginner', 'intermediate', 'advanced']).defaultTo('beginner');
    table.integer('estimated_hours');
    table.string('repository_url', 255);
    table.string('documentation_url', 255);
    table.string('thumbnail_url', 255);
    table.integer('view_count').defaultTo(0);
    table.integer('fork_count').defaultTo(0);
    table.integer('upvote_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('creator_id').references('users.id').onDelete('CASCADE');
    table.foreign('parent_project_id').references('projects.id').onDelete('SET NULL');
    table.index('category');
    table.index('parent_project_id');
    table.index('status');
    table.index('created_at');
    table.index('upvote_count');
  });

  await knex.schema.createTable('project_components', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.string('component_name', 255).notNullable();
    table.enum('component_type', ['microcontroller', 'sensor', 'motor', 'power', 'wireless', 'mechanical']).notNullable();
    table.string('part_number', 100);
    table.integer('quantity').defaultTo(1);
    table.decimal('unit_cost', 10, 2);
    table.string('supplier_url', 255);
    table.string('datasheet_url', 255);
    table.text('notes');
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.index(['project_id', 'component_type']);
  });

  await knex.schema.createTable('project_bom', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().unique().notNullable();
    table.decimal('total_cost', 10, 2);
    table.decimal('total_weight', 10, 3);
    table.integer('component_count');
    table.json('tool_requirements');
    table.integer('assembly_time_hours');
    table.enum('estimated_difficulty', ['beginner', 'intermediate', 'advanced']).defaultTo('intermediate');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.index('total_cost');
  });

  await knex.schema.createTable('project_error_logs', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('error_type', ['assembly', 'electrical', 'firmware', 'mechanical', 'software', 'other']).notNullable();
    table.text('description').notNullable();
    table.text('solution');
    table.enum('severity', ['critical', 'high', 'medium', 'low']).defaultTo('medium');
    table.boolean('resolved').defaultTo(false);
    table.integer('helpful_votes').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['project_id', 'error_type']);
    table.index('resolved');
  });

  await knex.schema.createTable('project_exports', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.enum('export_type', ['complete', 'bom-only', 'manual']).defaultTo('complete');
    table.string('export_path', 255).notNullable();
    table.enum('status', ['queued', 'processing', 'done', 'failed']).defaultTo('queued');
    table.integer('exported_by').unsigned();
    table.json('ai_enrichment_metadata');
    table.integer('file_size');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('exported_by').references('users.id').onDelete('SET NULL');
    table.index(['project_id', 'status']);
    table.index('status');
    table.index('created_at');
  });

  await knex.schema.createTable('project_collaborators', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('role', ['author', 'contributor', 'reviewer']).defaultTo('contributor');
    table.text('contribution_summary');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['project_id', 'user_id']);
    table.index('project_id');
  });

  await knex.schema.createTable('project_votes', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('vote_type', ['upvote', 'downvote', 'neutral']).defaultTo('upvote');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['project_id', 'user_id']);
    table.index('project_id');
    table.index('vote_type');
  });

  // Epic E3: Robots & Ranking
  await knex.schema.createTable('robot_models', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.enum('category', ['autonomous', 'competition', 'industrial', 'educational']).defaultTo('educational');
    table.json('specs');
    table.integer('bom_id').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index('category');
    table.index('created_at');
  });

  await knex.schema.createTable('robot_instances', (table) => {
    table.increments('id').primary();
    table.integer('robot_model_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('serial_number', 100);
    table.enum('status', ['assembled', 'testing', 'competition', 'archived']).defaultTo('assembled');
    table.string('firmware_version', 50);
    table.date('build_date');
    table.text('build_notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('robot_model_id').references('robot_models.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index('status');
    table.index('user_id');
  });

  await knex.schema.createTable('robot_matches', (table) => {
    table.increments('id').primary();
    table.integer('competition_id').unsigned();
    table.integer('robot_instance_id').unsigned().notNullable();
    table.integer('opponent_instance_id').unsigned();
    table.dateTime('match_date').notNullable();
    table.enum('result', ['win', 'loss', 'draw', 'dnf']).notNullable();
    table.integer('score_self');
    table.integer('score_opponent');
    table.integer('duration_seconds');
    table.integer('match_log_id').unsigned();
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('robot_instance_id').references('robot_instances.id').onDelete('CASCADE');
    table.index(['robot_instance_id', 'match_date']);
    table.index('result');
    table.index('competition_id');
  });

  await knex.schema.createTable('robot_rankings', (table) => {
    table.increments('id').primary();
    table.integer('robot_instance_id').unsigned().unique().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('category', ['autonomous', 'competition', 'industrial', 'educational']).notNullable();
    table.integer('rank_position');
    table.decimal('win_rate', 5, 2);
    table.integer('total_matches').defaultTo(0);
    table.integer('wins').defaultTo(0);
    table.integer('losses').defaultTo(0);
    table.integer('elo_score').defaultTo(1200);
    table.dateTime('last_match_date');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('robot_instance_id').references('robot_instances.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['category', 'rank_position']);
    table.index('elo_score');
  });

  await knex.schema.createTable('match_logs', (table) => {
    table.increments('id').primary();
    table.integer('match_id').unsigned().notNullable();
    table.text('log_data', 'longtext');
    table.json('telemetry');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('match_id').references('robot_matches.id').onDelete('CASCADE');
    table.index('match_id');
  });

  // Epic E4: Teams & Collaboration
  await knex.schema.createTable('teams', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.integer('owner_id').unsigned().notNullable();
    table.string('logo_url', 255);
    table.enum('visibility', ['public', 'private']).defaultTo('public');
    table.integer('max_members').defaultTo(10);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('owner_id').references('users.id').onDelete('CASCADE');
    table.index('created_at');
    table.index('owner_id');
  });

  await knex.schema.createTable('team_members', (table) => {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('role', ['owner', 'admin', 'contributor', 'viewer']).defaultTo('contributor');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.foreign('team_id').references('teams.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['team_id', 'user_id']);
    table.index(['team_id', 'role']);
  });

  await knex.schema.createTable('team_projects', (table) => {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable();
    table.integer('project_id').unsigned().notNullable();
    table.timestamp('added_at').defaultTo(knex.fn.now());
    table.foreign('team_id').references('teams.id').onDelete('CASCADE');
    table.unique(['team_id', 'project_id']);
    table.index('team_id');
  });

  await knex.schema.createTable('team_invites', (table) => {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable();
    table.string('email', 255).notNullable();
    table.enum('role', ['contributor', 'viewer']).defaultTo('contributor');
    table.string('token', 255).unique().notNullable();
    table.dateTime('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('team_id').references('teams.id').onDelete('CASCADE');
    table.index('token');
    table.index('expires_at');
  });

  // Epic E5: Communities & Knowledge
  await knex.schema.createTable('communities', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.enum('category', ['robotics', '3d-printing', 'iot', 'woodworking']).notNullable();
    table.integer('owner_id').unsigned().notNullable();
    table.string('icon_url', 255);
    table.integer('member_count').defaultTo(0);
    table.enum('visibility', ['public', 'private']).defaultTo('public');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('owner_id').references('users.id').onDelete('CASCADE');
    table.index('category');
    table.index('member_count');
  });

  await knex.schema.createTable('community_members', (table) => {
    table.increments('id').primary();
    table.integer('community_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('role', ['owner', 'moderator', 'member']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.foreign('community_id').references('communities.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['community_id', 'user_id']);
    table.index('community_id');
  });

  await knex.schema.createTable('discussions', (table) => {
    table.increments('id').primary();
    table.integer('community_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.json('tags');
    table.boolean('pinned').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('community_id').references('communities.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['community_id', 'created_at']);
    table.index('pinned');
  });

  await knex.schema.createTable('knowledge_items', (table) => {
    table.increments('id').primary();
    table.enum('source_type', ['post', 'project', 'discussion', 'documentation']).notNullable();
    table.integer('source_id').unsigned();
    table.string('title', 255);
    table.text('content').notNullable();
    table.json('metadata');
    table.integer('embedding_id').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['source_type', 'source_id']);
    table.index('created_at');
  });

  await knex.schema.createTable('knowledge_embeddings', (table) => {
    table.increments('id').primary();
    table.integer('knowledge_item_id').unsigned().unique().notNullable();
    table.string('vector_id', 255);
    table.string('model_name', 100).defaultTo('text-embedding-3-small');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('knowledge_item_id').references('knowledge_items.id').onDelete('CASCADE');
    table.index('vector_id');
  });

  // Epic E6: Governance & Observability
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.enum('entity_type', ['project', 'user', 'post', 'robot', 'team']).notNullable();
    table.integer('entity_id').unsigned().notNullable();
    table.enum('action', ['create', 'update', 'delete', 'fork', 'export']).notNullable();
    table.integer('user_id').unsigned();
    table.json('old_values');
    table.json('new_values');
    table.json('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('SET NULL');
    table.index(['entity_type', 'entity_id']);
    table.index('created_at');
    table.index('user_id');
  });

  await knex.schema.createTable('ai_pipeline_logs', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned();
    table.integer('export_id').unsigned();
    table.enum('pipeline_stage', ['extraction', 'preprocessing', 'rag_retrieval', 'model_inference', 'postprocessing', 'validation']).notNullable();
    table.enum('status', ['started', 'processing', 'completed', 'failed']).notNullable();
    table.integer('duration_ms');
    table.integer('input_tokens');
    table.integer('output_tokens');
    table.decimal('rag_relevance_score', 5, 3);
    table.json('validation_result');
    table.text('error_message');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('project_id').references('projects.id').onDelete('SET NULL');
    table.foreign('export_id').references('project_exports.id').onDelete('SET NULL');
    table.index('project_id');
    table.index(['pipeline_stage', 'status']);
    table.index('created_at');
  });

  await knex.schema.createTable('export_validation_logs', (table) => {
    table.increments('id').primary();
    table.integer('export_id').unsigned().notNullable();
    table.enum('validation_type', ['schema', 'completeness', 'consistency', 'accuracy']).notNullable();
    table.boolean('passed');
    table.json('details');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('export_id').references('project_exports.id').onDelete('CASCADE');
    table.index('export_id');
    table.index('passed');
  });

  await knex.schema.createTable('system_health', (table) => {
    table.increments('id').primary();
    table.enum('component', ['api', 'database', 'cache', 'storage', 'n8n', 'pinecone']).notNullable();
    table.enum('status', ['healthy', 'degraded', 'down']).defaultTo('healthy');
    table.integer('response_time_ms');
    table.decimal('error_rate', 5, 2);
    table.timestamp('last_check').defaultTo(knex.fn.now());
    table.json('metrics');
    table.index('component');
    table.index('last_check');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop all tables in reverse order of creation
  await knex.schema.dropTableIfExists('system_health');
  await knex.schema.dropTableIfExists('export_validation_logs');
  await knex.schema.dropTableIfExists('ai_pipeline_logs');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('knowledge_embeddings');
  await knex.schema.dropTableIfExists('knowledge_items');
  await knex.schema.dropTableIfExists('discussions');
  await knex.schema.dropTableIfExists('community_members');
  await knex.schema.dropTableIfExists('communities');
  await knex.schema.dropTableIfExists('team_invites');
  await knex.schema.dropTableIfExists('team_projects');
  await knex.schema.dropTableIfExists('team_members');
  await knex.schema.dropTableIfExists('teams');
  await knex.schema.dropTableIfExists('match_logs');
  await knex.schema.dropTableIfExists('robot_rankings');
  await knex.schema.dropTableIfExists('robot_matches');
  await knex.schema.dropTableIfExists('robot_instances');
  await knex.schema.dropTableIfExists('robot_models');
  await knex.schema.dropTableIfExists('project_votes');
  await knex.schema.dropTableIfExists('project_collaborators');
  await knex.schema.dropTableIfExists('project_exports');
  await knex.schema.dropTableIfExists('project_error_logs');
  await knex.schema.dropTableIfExists('project_bom');
  await knex.schema.dropTableIfExists('project_components');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('post_likes');
  await knex.schema.dropTableIfExists('post_comments');
  await knex.schema.dropTableIfExists('posts');
  await knex.schema.dropTableIfExists('user_follows');
  await knex.schema.dropTableIfExists('user_hardware_stack');
  await knex.schema.dropTableIfExists('user_badges');
  await knex.schema.dropTableIfExists('user_profiles');
  await knex.schema.dropTableIfExists('users');
}
