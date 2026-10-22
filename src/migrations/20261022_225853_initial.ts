import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_writers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__writers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_books_category" AS ENUM('fiction', 'poetry', 'anthology', 'non-fiction');
  CREATE TYPE "public"."enum_books_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__books_v_version_category" AS ENUM('fiction', 'poetry', 'anthology', 'non-fiction');
  CREATE TYPE "public"."enum__books_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_podcast_episodes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__podcast_episodes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_submission_calls_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__submission_calls_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."award_status" AS ENUM('open', 'judging', 'winners-announced', 'closed');
  CREATE TYPE "public"."enum_awards_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__awards_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_careers_type" AS ENUM('full-time', 'part-time', 'contract', 'internship', 'nysc');
  CREATE TYPE "public"."enum_careers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__careers_v_version_type" AS ENUM('full-time', 'part-time', 'contract', 'internship', 'nysc');
  CREATE TYPE "public"."enum__careers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_book_club_sessions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__book_club_sessions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_merch_type" AS ENUM('stationery', 'apparel', 'other');
  CREATE TYPE "public"."enum_merch_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__merch_v_version_type" AS ENUM('stationery', 'apparel', 'other');
  CREATE TYPE "public"."enum__merch_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_studio_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__studio_services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_membership_plans_billing" AS ENUM('monthly', 'yearly');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('new', 'in-progress', 'done');
  CREATE TYPE "public"."enum_partnership_enquiries_partnership_type" AS ENUM('sponsorship', 'advertising', 'media', 'events', 'other');
  CREATE TYPE "public"."enum_partnership_enquiries_status" AS ENUM('new', 'in-progress', 'done');
  CREATE TYPE "public"."enum_bookstore_applications_store_type" AS ENUM('independent', 'chain', 'online', 'library', 'other');
  CREATE TYPE "public"."enum_bookstore_applications_status" AS ENUM('new', 'in-progress', 'done');
  CREATE TYPE "public"."enum_advisory_enquiries_status" AS ENUM('new', 'in-progress', 'done');
  CREATE TYPE "public"."enum_manuscript_submissions_status" AS ENUM('new', 'in-progress', 'done');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('instagram', 'x', 'facebook', 'tiktok', 'youtube', 'linkedin', 'spotify', 'other');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "manuscripts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "writers_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "writers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"photo_id" integer,
  	"short_bio" varchar,
  	"bio" jsonb,
  	"show_on_writers_page" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_writers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_writers_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_writers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_photo_id" integer,
  	"version_short_bio" varchar,
  	"version_bio" jsonb,
  	"version_show_on_writers_page" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__writers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "books_formats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"format_name" varchar,
  	"price_n_g_n" numeric,
  	"in_stock" boolean DEFAULT true,
  	"weight_grams" numeric
  );
  
  CREATE TABLE "books" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"cover_id" integer,
  	"category" "enum_books_category",
  	"summary" varchar,
  	"synopsis" jsonb,
  	"publish_date" timestamp(3) with time zone,
  	"page_count" numeric,
  	"isbn" varchar,
  	"sell_in_shop" boolean DEFAULT false,
  	"new_release" boolean DEFAULT false,
  	"editors_choice" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_books_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "books_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"writers_id" integer
  );
  
  CREATE TABLE "_books_v_version_formats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"format_name" varchar,
  	"price_n_g_n" numeric,
  	"in_stock" boolean DEFAULT true,
  	"weight_grams" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_books_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_cover_id" integer,
  	"version_category" "enum__books_v_version_category",
  	"version_summary" varchar,
  	"version_synopsis" jsonb,
  	"version_publish_date" timestamp(3) with time zone,
  	"version_page_count" numeric,
  	"version_isbn" varchar,
  	"version_sell_in_shop" boolean DEFAULT false,
  	"version_new_release" boolean DEFAULT false,
  	"version_editors_choice" boolean DEFAULT false,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__books_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_books_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"writers_id" integer
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"cover_id" integer,
  	"summary" varchar,
  	"body" jsonb,
  	"featured" boolean DEFAULT false,
  	"publish_date" timestamp(3) with time zone,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"writers_id" integer,
  	"categories_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_cover_id" integer,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_featured" boolean DEFAULT false,
  	"version_publish_date" timestamp(3) with time zone,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"writers_id" integer,
  	"categories_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "podcast_shows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"cover_id" integer,
  	"spotify_url" varchar,
  	"youtube_url" varchar,
  	"apple_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcast_episodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"show_id" integer,
  	"episode_number" numeric,
  	"date" timestamp(3) with time zone,
  	"length_minutes" numeric,
  	"summary" varchar,
  	"show_notes" jsonb,
  	"spotify_url" varchar,
  	"youtube_url" varchar,
  	"cover_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_podcast_episodes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "podcast_episodes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"writers_id" integer
  );
  
  CREATE TABLE "_podcast_episodes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_show_id" integer,
  	"version_episode_number" numeric,
  	"version_date" timestamp(3) with time zone,
  	"version_length_minutes" numeric,
  	"version_summary" varchar,
  	"version_show_notes" jsonb,
  	"version_spotify_url" varchar,
  	"version_youtube_url" varchar,
  	"version_cover_id" integer,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__podcast_episodes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_podcast_episodes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"writers_id" integer
  );
  
  CREATE TABLE "submission_calls" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"theme_summary" varchar,
  	"guidelines" jsonb,
  	"opens_at" timestamp(3) with time zone,
  	"closes_at" timestamp(3) with time zone,
  	"cover_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_submission_calls_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_submission_calls_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_theme_summary" varchar,
  	"version_guidelines" jsonb,
  	"version_opens_at" timestamp(3) with time zone,
  	"version_closes_at" timestamp(3) with time zone,
  	"version_cover_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__submission_calls_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "awards_key_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "awards_past_winners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"name" varchar,
  	"work" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "awards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"status" "award_status" DEFAULT 'open',
  	"summary" varchar,
  	"rules" jsonb,
  	"prize" varchar,
  	"how_to_enter" jsonb,
  	"entry_url" varchar,
  	"cover_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_awards_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_awards_v_version_key_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_awards_v_version_past_winners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"name" varchar,
  	"work" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_awards_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_status" "award_status" DEFAULT 'open',
  	"version_summary" varchar,
  	"version_rules" jsonb,
  	"version_prize" varchar,
  	"version_how_to_enter" jsonb,
  	"version_entry_url" varchar,
  	"version_cover_id" integer,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__awards_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"venue" varchar,
  	"address" varchar,
  	"online_url" varchar,
  	"description" jsonb,
  	"image_id" integer,
  	"action_url" varchar,
  	"action_label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_venue" varchar,
  	"version_address" varchar,
  	"version_online_url" varchar,
  	"version_description" jsonb,
  	"version_image_id" integer,
  	"version_action_url" varchar,
  	"version_action_label" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "careers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"type" "enum_careers_type",
  	"location" varchar,
  	"description" jsonb,
  	"how_to_apply" varchar,
  	"closing_date" timestamp(3) with time zone,
  	"open" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_careers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_careers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_role" varchar,
  	"version_type" "enum__careers_v_version_type",
  	"version_location" varchar,
  	"version_description" jsonb,
  	"version_how_to_apply" varchar,
  	"version_closing_date" timestamp(3) with time zone,
  	"version_open" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__careers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "book_club_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"book_id" integer,
  	"title" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"venue" varchar,
  	"online_url" varchar,
  	"description" varchar,
  	"registration_open" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_book_club_sessions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_book_club_sessions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_book_id" integer,
  	"version_title" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_venue" varchar,
  	"version_online_url" varchar,
  	"version_description" varchar,
  	"version_registration_open" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__book_club_sessions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "merch" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"price_n_g_n" numeric,
  	"weight_grams" numeric,
  	"type" "enum_merch_type",
  	"in_stock" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_merch_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "merch_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_merch_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_price_n_g_n" numeric,
  	"version_weight_grams" numeric,
  	"version_type" "enum__merch_v_version_type",
  	"version_in_stock" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__merch_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_merch_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "studio_services_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "studio_services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"description" varchar,
  	"hourly_rate_n_g_n" numeric,
  	"half_day_rate_n_g_n" numeric,
  	"full_day_rate_n_g_n" numeric,
  	"bookable" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_studio_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "studio_services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_studio_services_v_version_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_studio_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_hourly_rate_n_g_n" numeric,
  	"version_half_day_rate_n_g_n" numeric,
  	"version_full_day_rate_n_g_n" numeric,
  	"version_bookable" boolean DEFAULT true,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__studio_services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_studio_services_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "membership_plans_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"perk" varchar NOT NULL
  );
  
  CREATE TABLE "membership_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price_n_g_n" numeric NOT NULL,
  	"billing" "enum_membership_plans_billing" NOT NULL,
  	"active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"body" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_body" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"url" varchar,
  	"button_label" varchar,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "popup_campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"book_id" integer NOT NULL,
  	"headline" varchar NOT NULL,
  	"pitch" varchar,
  	"button_label" varchar,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "press_mentions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"outlet" varchar NOT NULL,
  	"headline" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"date" timestamp(3) with time zone,
  	"logo_id" integer,
  	"quote" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer,
  	"quote" varchar,
  	"quote_by" varchar,
  	"quote_by_title" varchar,
  	"url" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"subject" varchar,
  	"message" varchar NOT NULL,
  	"status" "enum_contact_messages_status" DEFAULT 'new' NOT NULL,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partnership_enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"organisation" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"partnership_type" "enum_partnership_enquiries_partnership_type" NOT NULL,
  	"message" varchar NOT NULL,
  	"status" "enum_partnership_enquiries_status" DEFAULT 'new' NOT NULL,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookstore_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"store_name" varchar NOT NULL,
  	"contact_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"address_line1" varchar NOT NULL,
  	"address_city" varchar NOT NULL,
  	"address_state" varchar NOT NULL,
  	"website_or_social" varchar,
  	"store_type" "enum_bookstore_applications_store_type" NOT NULL,
  	"message" varchar,
  	"status" "enum_bookstore_applications_status" DEFAULT 'new' NOT NULL,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "advisory_enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"organisation" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"needs" varchar NOT NULL,
  	"status" "enum_advisory_enquiries_status" DEFAULT 'new' NOT NULL,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manuscript_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"call_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"work_title" varchar NOT NULL,
  	"word_count" numeric,
  	"short_bio" varchar NOT NULL,
  	"cover_note" varchar,
  	"file_id" integer NOT NULL,
  	"status" "enum_manuscript_submissions_status" DEFAULT 'new' NOT NULL,
  	"staff_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"categories_id" integer,
  	"tags_id" integer,
  	"media_id" integer,
  	"manuscripts_id" integer,
  	"writers_id" integer,
  	"books_id" integer,
  	"articles_id" integer,
  	"podcast_shows_id" integer,
  	"podcast_episodes_id" integer,
  	"submission_calls_id" integer,
  	"awards_id" integer,
  	"events_id" integer,
  	"careers_id" integer,
  	"book_club_sessions_id" integer,
  	"merch_id" integer,
  	"studio_services_id" integer,
  	"membership_plans_id" integer,
  	"pages_id" integer,
  	"announcements_id" integer,
  	"popup_campaigns_id" integer,
  	"press_mentions_id" integer,
  	"partners_id" integer,
  	"contact_messages_id" integer,
  	"partnership_enquiries_id" integer,
  	"bookstore_applications_id" integer,
  	"advisory_enquiries_id" integer,
  	"manuscript_submissions_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "page_home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_publishing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_writers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"guidelines" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_awards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_advisory" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_distribution" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_studio" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_blog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_podcast" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_shop" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_book_club" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_membership" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_careers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_who_we_are" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_press" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_contact" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_partner" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "page_support" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"intro" jsonb,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_email" varchar NOT NULL,
  	"phone" varchar,
  	"address" varchar,
  	"footer_text" varchar,
  	"newsletter_text" varchar,
  	"default_share_image_id" integer,
  	"form_alert_email" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "shop_settings_flat_delivery_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"area_name" varchar NOT NULL,
  	"price_n_g_n" numeric NOT NULL
  );
  
  CREATE TABLE "shop_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pickup_address_name" varchar,
  	"pickup_address_phone" varchar,
  	"pickup_address_line1" varchar,
  	"pickup_address_city" varchar,
  	"pickup_address_state" varchar,
  	"pickup_address_country" varchar DEFAULT 'Nigeria',
  	"member_discount_percent" numeric DEFAULT 20,
  	"unpaid_order_expiry_minutes" numeric DEFAULT 30,
  	"order_alert_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "writers_links" ADD CONSTRAINT "writers_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "writers" ADD CONSTRAINT "writers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "writers" ADD CONSTRAINT "writers_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_writers_v_version_links" ADD CONSTRAINT "_writers_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_writers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_writers_v" ADD CONSTRAINT "_writers_v_parent_id_writers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."writers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_writers_v" ADD CONSTRAINT "_writers_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_writers_v" ADD CONSTRAINT "_writers_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books_formats" ADD CONSTRAINT "books_formats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books" ADD CONSTRAINT "books_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "books_rels" ADD CONSTRAINT "books_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_version_formats" ADD CONSTRAINT "_books_v_version_formats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_parent_id_books_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v_rels" ADD CONSTRAINT "_books_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_books_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_books_v_rels" ADD CONSTRAINT "_books_v_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcast_shows" ADD CONSTRAINT "podcast_shows_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_show_id_podcast_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."podcast_shows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes_rels" ADD CONSTRAINT "podcast_episodes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcast_episodes_rels" ADD CONSTRAINT "podcast_episodes_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_parent_id_podcast_episodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_version_show_id_podcast_shows_id_fk" FOREIGN KEY ("version_show_id") REFERENCES "public"."podcast_shows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v_rels" ADD CONSTRAINT "_podcast_episodes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_podcast_episodes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v_rels" ADD CONSTRAINT "_podcast_episodes_v_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submission_calls" ADD CONSTRAINT "submission_calls_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_submission_calls_v" ADD CONSTRAINT "_submission_calls_v_parent_id_submission_calls_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submission_calls"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_submission_calls_v" ADD CONSTRAINT "_submission_calls_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards_key_dates" ADD CONSTRAINT "awards_key_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "awards_past_winners" ADD CONSTRAINT "awards_past_winners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "awards" ADD CONSTRAINT "awards_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards" ADD CONSTRAINT "awards_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_awards_v_version_key_dates" ADD CONSTRAINT "_awards_v_version_key_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_awards_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_awards_v_version_past_winners" ADD CONSTRAINT "_awards_v_version_past_winners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_awards_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_awards_v" ADD CONSTRAINT "_awards_v_parent_id_awards_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."awards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_awards_v" ADD CONSTRAINT "_awards_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_awards_v" ADD CONSTRAINT "_awards_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_careers_v" ADD CONSTRAINT "_careers_v_parent_id_careers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."careers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "book_club_sessions" ADD CONSTRAINT "book_club_sessions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_book_club_sessions_v" ADD CONSTRAINT "_book_club_sessions_v_parent_id_book_club_sessions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."book_club_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_book_club_sessions_v" ADD CONSTRAINT "_book_club_sessions_v_version_book_id_books_id_fk" FOREIGN KEY ("version_book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "merch" ADD CONSTRAINT "merch_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "merch_rels" ADD CONSTRAINT "merch_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."merch"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "merch_rels" ADD CONSTRAINT "merch_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_merch_v" ADD CONSTRAINT "_merch_v_parent_id_merch_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."merch"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_merch_v" ADD CONSTRAINT "_merch_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_merch_v_rels" ADD CONSTRAINT "_merch_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_merch_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_merch_v_rels" ADD CONSTRAINT "_merch_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studio_services_inclusions" ADD CONSTRAINT "studio_services_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."studio_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studio_services_rels" ADD CONSTRAINT "studio_services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."studio_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studio_services_rels" ADD CONSTRAINT "studio_services_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_studio_services_v_version_inclusions" ADD CONSTRAINT "_studio_services_v_version_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_studio_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_studio_services_v" ADD CONSTRAINT "_studio_services_v_parent_id_studio_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."studio_services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_studio_services_v_rels" ADD CONSTRAINT "_studio_services_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_studio_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_studio_services_v_rels" ADD CONSTRAINT "_studio_services_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "membership_plans_perks" ADD CONSTRAINT "membership_plans_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."membership_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "popup_campaigns" ADD CONSTRAINT "popup_campaigns_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "press_mentions" ADD CONSTRAINT "press_mentions_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manuscript_submissions" ADD CONSTRAINT "manuscript_submissions_call_id_submission_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."submission_calls"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manuscript_submissions" ADD CONSTRAINT "manuscript_submissions_file_id_manuscripts_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."manuscripts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manuscripts_fk" FOREIGN KEY ("manuscripts_id") REFERENCES "public"."manuscripts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_writers_fk" FOREIGN KEY ("writers_id") REFERENCES "public"."writers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_shows_fk" FOREIGN KEY ("podcast_shows_id") REFERENCES "public"."podcast_shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_episodes_fk" FOREIGN KEY ("podcast_episodes_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submission_calls_fk" FOREIGN KEY ("submission_calls_id") REFERENCES "public"."submission_calls"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_careers_fk" FOREIGN KEY ("careers_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_club_sessions_fk" FOREIGN KEY ("book_club_sessions_id") REFERENCES "public"."book_club_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_merch_fk" FOREIGN KEY ("merch_id") REFERENCES "public"."merch"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_studio_services_fk" FOREIGN KEY ("studio_services_id") REFERENCES "public"."studio_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_membership_plans_fk" FOREIGN KEY ("membership_plans_id") REFERENCES "public"."membership_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_popup_campaigns_fk" FOREIGN KEY ("popup_campaigns_id") REFERENCES "public"."popup_campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_press_mentions_fk" FOREIGN KEY ("press_mentions_id") REFERENCES "public"."press_mentions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partnership_enquiries_fk" FOREIGN KEY ("partnership_enquiries_id") REFERENCES "public"."partnership_enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookstore_applications_fk" FOREIGN KEY ("bookstore_applications_id") REFERENCES "public"."bookstore_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_advisory_enquiries_fk" FOREIGN KEY ("advisory_enquiries_id") REFERENCES "public"."advisory_enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manuscript_submissions_fk" FOREIGN KEY ("manuscript_submissions_id") REFERENCES "public"."manuscript_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_home" ADD CONSTRAINT "page_home_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_home" ADD CONSTRAINT "page_home_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_publishing" ADD CONSTRAINT "page_publishing_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_publishing" ADD CONSTRAINT "page_publishing_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_writers" ADD CONSTRAINT "page_writers_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_writers" ADD CONSTRAINT "page_writers_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_submissions" ADD CONSTRAINT "page_submissions_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_submissions" ADD CONSTRAINT "page_submissions_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_awards" ADD CONSTRAINT "page_awards_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_awards" ADD CONSTRAINT "page_awards_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_advisory" ADD CONSTRAINT "page_advisory_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_advisory" ADD CONSTRAINT "page_advisory_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_distribution" ADD CONSTRAINT "page_distribution_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_distribution" ADD CONSTRAINT "page_distribution_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_studio" ADD CONSTRAINT "page_studio_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_studio" ADD CONSTRAINT "page_studio_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_blog" ADD CONSTRAINT "page_blog_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_blog" ADD CONSTRAINT "page_blog_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_podcast" ADD CONSTRAINT "page_podcast_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_podcast" ADD CONSTRAINT "page_podcast_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_shop" ADD CONSTRAINT "page_shop_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_shop" ADD CONSTRAINT "page_shop_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_book_club" ADD CONSTRAINT "page_book_club_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_book_club" ADD CONSTRAINT "page_book_club_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_membership" ADD CONSTRAINT "page_membership_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_membership" ADD CONSTRAINT "page_membership_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_events" ADD CONSTRAINT "page_events_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_events" ADD CONSTRAINT "page_events_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_careers" ADD CONSTRAINT "page_careers_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_careers" ADD CONSTRAINT "page_careers_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_who_we_are" ADD CONSTRAINT "page_who_we_are_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_who_we_are" ADD CONSTRAINT "page_who_we_are_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_press" ADD CONSTRAINT "page_press_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_press" ADD CONSTRAINT "page_press_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_contact" ADD CONSTRAINT "page_contact_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_contact" ADD CONSTRAINT "page_contact_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_partner" ADD CONSTRAINT "page_partner_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_partner" ADD CONSTRAINT "page_partner_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_support" ADD CONSTRAINT "page_support_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_support" ADD CONSTRAINT "page_support_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_share_image_id_media_id_fk" FOREIGN KEY ("default_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_settings_flat_delivery_prices" ADD CONSTRAINT "shop_settings_flat_delivery_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shop_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "manuscripts_updated_at_idx" ON "manuscripts" USING btree ("updated_at");
  CREATE INDEX "manuscripts_created_at_idx" ON "manuscripts" USING btree ("created_at");
  CREATE UNIQUE INDEX "manuscripts_filename_idx" ON "manuscripts" USING btree ("filename");
  CREATE INDEX "writers_links_order_idx" ON "writers_links" USING btree ("_order");
  CREATE INDEX "writers_links_parent_id_idx" ON "writers_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "writers_slug_idx" ON "writers" USING btree ("slug");
  CREATE INDEX "writers_photo_idx" ON "writers" USING btree ("photo_id");
  CREATE INDEX "writers_meta_meta_image_idx" ON "writers" USING btree ("meta_image_id");
  CREATE INDEX "writers_updated_at_idx" ON "writers" USING btree ("updated_at");
  CREATE INDEX "writers_created_at_idx" ON "writers" USING btree ("created_at");
  CREATE INDEX "writers__status_idx" ON "writers" USING btree ("_status");
  CREATE INDEX "_writers_v_version_links_order_idx" ON "_writers_v_version_links" USING btree ("_order");
  CREATE INDEX "_writers_v_version_links_parent_id_idx" ON "_writers_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_writers_v_parent_idx" ON "_writers_v" USING btree ("parent_id");
  CREATE INDEX "_writers_v_version_version_slug_idx" ON "_writers_v" USING btree ("version_slug");
  CREATE INDEX "_writers_v_version_version_photo_idx" ON "_writers_v" USING btree ("version_photo_id");
  CREATE INDEX "_writers_v_version_meta_version_meta_image_idx" ON "_writers_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_writers_v_version_version_updated_at_idx" ON "_writers_v" USING btree ("version_updated_at");
  CREATE INDEX "_writers_v_version_version_created_at_idx" ON "_writers_v" USING btree ("version_created_at");
  CREATE INDEX "_writers_v_version_version__status_idx" ON "_writers_v" USING btree ("version__status");
  CREATE INDEX "_writers_v_created_at_idx" ON "_writers_v" USING btree ("created_at");
  CREATE INDEX "_writers_v_updated_at_idx" ON "_writers_v" USING btree ("updated_at");
  CREATE INDEX "_writers_v_latest_idx" ON "_writers_v" USING btree ("latest");
  CREATE INDEX "books_formats_order_idx" ON "books_formats" USING btree ("_order");
  CREATE INDEX "books_formats_parent_id_idx" ON "books_formats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "books_slug_idx" ON "books" USING btree ("slug");
  CREATE INDEX "books_cover_idx" ON "books" USING btree ("cover_id");
  CREATE INDEX "books_meta_meta_image_idx" ON "books" USING btree ("meta_image_id");
  CREATE INDEX "books_updated_at_idx" ON "books" USING btree ("updated_at");
  CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");
  CREATE INDEX "books__status_idx" ON "books" USING btree ("_status");
  CREATE INDEX "books_rels_order_idx" ON "books_rels" USING btree ("order");
  CREATE INDEX "books_rels_parent_idx" ON "books_rels" USING btree ("parent_id");
  CREATE INDEX "books_rels_path_idx" ON "books_rels" USING btree ("path");
  CREATE INDEX "books_rels_writers_id_idx" ON "books_rels" USING btree ("writers_id");
  CREATE INDEX "_books_v_version_formats_order_idx" ON "_books_v_version_formats" USING btree ("_order");
  CREATE INDEX "_books_v_version_formats_parent_id_idx" ON "_books_v_version_formats" USING btree ("_parent_id");
  CREATE INDEX "_books_v_parent_idx" ON "_books_v" USING btree ("parent_id");
  CREATE INDEX "_books_v_version_version_slug_idx" ON "_books_v" USING btree ("version_slug");
  CREATE INDEX "_books_v_version_version_cover_idx" ON "_books_v" USING btree ("version_cover_id");
  CREATE INDEX "_books_v_version_meta_version_meta_image_idx" ON "_books_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_books_v_version_version_updated_at_idx" ON "_books_v" USING btree ("version_updated_at");
  CREATE INDEX "_books_v_version_version_created_at_idx" ON "_books_v" USING btree ("version_created_at");
  CREATE INDEX "_books_v_version_version__status_idx" ON "_books_v" USING btree ("version__status");
  CREATE INDEX "_books_v_created_at_idx" ON "_books_v" USING btree ("created_at");
  CREATE INDEX "_books_v_updated_at_idx" ON "_books_v" USING btree ("updated_at");
  CREATE INDEX "_books_v_latest_idx" ON "_books_v" USING btree ("latest");
  CREATE INDEX "_books_v_rels_order_idx" ON "_books_v_rels" USING btree ("order");
  CREATE INDEX "_books_v_rels_parent_idx" ON "_books_v_rels" USING btree ("parent_id");
  CREATE INDEX "_books_v_rels_path_idx" ON "_books_v_rels" USING btree ("path");
  CREATE INDEX "_books_v_rels_writers_id_idx" ON "_books_v_rels" USING btree ("writers_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_cover_idx" ON "articles" USING btree ("cover_id");
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_writers_id_idx" ON "articles_rels" USING btree ("writers_id");
  CREATE INDEX "articles_rels_categories_id_idx" ON "articles_rels" USING btree ("categories_id");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_cover_idx" ON "_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_writers_id_idx" ON "_articles_v_rels" USING btree ("writers_id");
  CREATE INDEX "_articles_v_rels_categories_id_idx" ON "_articles_v_rels" USING btree ("categories_id");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "_articles_v_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "podcast_shows_slug_idx" ON "podcast_shows" USING btree ("slug");
  CREATE INDEX "podcast_shows_cover_idx" ON "podcast_shows" USING btree ("cover_id");
  CREATE INDEX "podcast_shows_updated_at_idx" ON "podcast_shows" USING btree ("updated_at");
  CREATE INDEX "podcast_shows_created_at_idx" ON "podcast_shows" USING btree ("created_at");
  CREATE UNIQUE INDEX "podcast_episodes_slug_idx" ON "podcast_episodes" USING btree ("slug");
  CREATE INDEX "podcast_episodes_show_idx" ON "podcast_episodes" USING btree ("show_id");
  CREATE INDEX "podcast_episodes_cover_idx" ON "podcast_episodes" USING btree ("cover_id");
  CREATE INDEX "podcast_episodes_meta_meta_image_idx" ON "podcast_episodes" USING btree ("meta_image_id");
  CREATE INDEX "podcast_episodes_updated_at_idx" ON "podcast_episodes" USING btree ("updated_at");
  CREATE INDEX "podcast_episodes_created_at_idx" ON "podcast_episodes" USING btree ("created_at");
  CREATE INDEX "podcast_episodes__status_idx" ON "podcast_episodes" USING btree ("_status");
  CREATE INDEX "podcast_episodes_rels_order_idx" ON "podcast_episodes_rels" USING btree ("order");
  CREATE INDEX "podcast_episodes_rels_parent_idx" ON "podcast_episodes_rels" USING btree ("parent_id");
  CREATE INDEX "podcast_episodes_rels_path_idx" ON "podcast_episodes_rels" USING btree ("path");
  CREATE INDEX "podcast_episodes_rels_writers_id_idx" ON "podcast_episodes_rels" USING btree ("writers_id");
  CREATE INDEX "_podcast_episodes_v_parent_idx" ON "_podcast_episodes_v" USING btree ("parent_id");
  CREATE INDEX "_podcast_episodes_v_version_version_slug_idx" ON "_podcast_episodes_v" USING btree ("version_slug");
  CREATE INDEX "_podcast_episodes_v_version_version_show_idx" ON "_podcast_episodes_v" USING btree ("version_show_id");
  CREATE INDEX "_podcast_episodes_v_version_version_cover_idx" ON "_podcast_episodes_v" USING btree ("version_cover_id");
  CREATE INDEX "_podcast_episodes_v_version_meta_version_meta_image_idx" ON "_podcast_episodes_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_podcast_episodes_v_version_version_updated_at_idx" ON "_podcast_episodes_v" USING btree ("version_updated_at");
  CREATE INDEX "_podcast_episodes_v_version_version_created_at_idx" ON "_podcast_episodes_v" USING btree ("version_created_at");
  CREATE INDEX "_podcast_episodes_v_version_version__status_idx" ON "_podcast_episodes_v" USING btree ("version__status");
  CREATE INDEX "_podcast_episodes_v_created_at_idx" ON "_podcast_episodes_v" USING btree ("created_at");
  CREATE INDEX "_podcast_episodes_v_updated_at_idx" ON "_podcast_episodes_v" USING btree ("updated_at");
  CREATE INDEX "_podcast_episodes_v_latest_idx" ON "_podcast_episodes_v" USING btree ("latest");
  CREATE INDEX "_podcast_episodes_v_rels_order_idx" ON "_podcast_episodes_v_rels" USING btree ("order");
  CREATE INDEX "_podcast_episodes_v_rels_parent_idx" ON "_podcast_episodes_v_rels" USING btree ("parent_id");
  CREATE INDEX "_podcast_episodes_v_rels_path_idx" ON "_podcast_episodes_v_rels" USING btree ("path");
  CREATE INDEX "_podcast_episodes_v_rels_writers_id_idx" ON "_podcast_episodes_v_rels" USING btree ("writers_id");
  CREATE UNIQUE INDEX "submission_calls_slug_idx" ON "submission_calls" USING btree ("slug");
  CREATE INDEX "submission_calls_cover_idx" ON "submission_calls" USING btree ("cover_id");
  CREATE INDEX "submission_calls_updated_at_idx" ON "submission_calls" USING btree ("updated_at");
  CREATE INDEX "submission_calls_created_at_idx" ON "submission_calls" USING btree ("created_at");
  CREATE INDEX "submission_calls__status_idx" ON "submission_calls" USING btree ("_status");
  CREATE INDEX "_submission_calls_v_parent_idx" ON "_submission_calls_v" USING btree ("parent_id");
  CREATE INDEX "_submission_calls_v_version_version_slug_idx" ON "_submission_calls_v" USING btree ("version_slug");
  CREATE INDEX "_submission_calls_v_version_version_cover_idx" ON "_submission_calls_v" USING btree ("version_cover_id");
  CREATE INDEX "_submission_calls_v_version_version_updated_at_idx" ON "_submission_calls_v" USING btree ("version_updated_at");
  CREATE INDEX "_submission_calls_v_version_version_created_at_idx" ON "_submission_calls_v" USING btree ("version_created_at");
  CREATE INDEX "_submission_calls_v_version_version__status_idx" ON "_submission_calls_v" USING btree ("version__status");
  CREATE INDEX "_submission_calls_v_created_at_idx" ON "_submission_calls_v" USING btree ("created_at");
  CREATE INDEX "_submission_calls_v_updated_at_idx" ON "_submission_calls_v" USING btree ("updated_at");
  CREATE INDEX "_submission_calls_v_latest_idx" ON "_submission_calls_v" USING btree ("latest");
  CREATE INDEX "awards_key_dates_order_idx" ON "awards_key_dates" USING btree ("_order");
  CREATE INDEX "awards_key_dates_parent_id_idx" ON "awards_key_dates" USING btree ("_parent_id");
  CREATE INDEX "awards_past_winners_order_idx" ON "awards_past_winners" USING btree ("_order");
  CREATE INDEX "awards_past_winners_parent_id_idx" ON "awards_past_winners" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "awards_slug_idx" ON "awards" USING btree ("slug");
  CREATE INDEX "awards_cover_idx" ON "awards" USING btree ("cover_id");
  CREATE INDEX "awards_meta_meta_image_idx" ON "awards" USING btree ("meta_image_id");
  CREATE INDEX "awards_updated_at_idx" ON "awards" USING btree ("updated_at");
  CREATE INDEX "awards_created_at_idx" ON "awards" USING btree ("created_at");
  CREATE INDEX "awards__status_idx" ON "awards" USING btree ("_status");
  CREATE INDEX "_awards_v_version_key_dates_order_idx" ON "_awards_v_version_key_dates" USING btree ("_order");
  CREATE INDEX "_awards_v_version_key_dates_parent_id_idx" ON "_awards_v_version_key_dates" USING btree ("_parent_id");
  CREATE INDEX "_awards_v_version_past_winners_order_idx" ON "_awards_v_version_past_winners" USING btree ("_order");
  CREATE INDEX "_awards_v_version_past_winners_parent_id_idx" ON "_awards_v_version_past_winners" USING btree ("_parent_id");
  CREATE INDEX "_awards_v_parent_idx" ON "_awards_v" USING btree ("parent_id");
  CREATE INDEX "_awards_v_version_version_slug_idx" ON "_awards_v" USING btree ("version_slug");
  CREATE INDEX "_awards_v_version_version_cover_idx" ON "_awards_v" USING btree ("version_cover_id");
  CREATE INDEX "_awards_v_version_meta_version_meta_image_idx" ON "_awards_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_awards_v_version_version_updated_at_idx" ON "_awards_v" USING btree ("version_updated_at");
  CREATE INDEX "_awards_v_version_version_created_at_idx" ON "_awards_v" USING btree ("version_created_at");
  CREATE INDEX "_awards_v_version_version__status_idx" ON "_awards_v" USING btree ("version__status");
  CREATE INDEX "_awards_v_created_at_idx" ON "_awards_v" USING btree ("created_at");
  CREATE INDEX "_awards_v_updated_at_idx" ON "_awards_v" USING btree ("updated_at");
  CREATE INDEX "_awards_v_latest_idx" ON "_awards_v" USING btree ("latest");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_image_idx" ON "_events_v" USING btree ("version_image_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "careers_updated_at_idx" ON "careers" USING btree ("updated_at");
  CREATE INDEX "careers_created_at_idx" ON "careers" USING btree ("created_at");
  CREATE INDEX "careers__status_idx" ON "careers" USING btree ("_status");
  CREATE INDEX "_careers_v_parent_idx" ON "_careers_v" USING btree ("parent_id");
  CREATE INDEX "_careers_v_version_version_updated_at_idx" ON "_careers_v" USING btree ("version_updated_at");
  CREATE INDEX "_careers_v_version_version_created_at_idx" ON "_careers_v" USING btree ("version_created_at");
  CREATE INDEX "_careers_v_version_version__status_idx" ON "_careers_v" USING btree ("version__status");
  CREATE INDEX "_careers_v_created_at_idx" ON "_careers_v" USING btree ("created_at");
  CREATE INDEX "_careers_v_updated_at_idx" ON "_careers_v" USING btree ("updated_at");
  CREATE INDEX "_careers_v_latest_idx" ON "_careers_v" USING btree ("latest");
  CREATE INDEX "book_club_sessions_book_idx" ON "book_club_sessions" USING btree ("book_id");
  CREATE INDEX "book_club_sessions_updated_at_idx" ON "book_club_sessions" USING btree ("updated_at");
  CREATE INDEX "book_club_sessions_created_at_idx" ON "book_club_sessions" USING btree ("created_at");
  CREATE INDEX "book_club_sessions__status_idx" ON "book_club_sessions" USING btree ("_status");
  CREATE INDEX "_book_club_sessions_v_parent_idx" ON "_book_club_sessions_v" USING btree ("parent_id");
  CREATE INDEX "_book_club_sessions_v_version_version_book_idx" ON "_book_club_sessions_v" USING btree ("version_book_id");
  CREATE INDEX "_book_club_sessions_v_version_version_updated_at_idx" ON "_book_club_sessions_v" USING btree ("version_updated_at");
  CREATE INDEX "_book_club_sessions_v_version_version_created_at_idx" ON "_book_club_sessions_v" USING btree ("version_created_at");
  CREATE INDEX "_book_club_sessions_v_version_version__status_idx" ON "_book_club_sessions_v" USING btree ("version__status");
  CREATE INDEX "_book_club_sessions_v_created_at_idx" ON "_book_club_sessions_v" USING btree ("created_at");
  CREATE INDEX "_book_club_sessions_v_updated_at_idx" ON "_book_club_sessions_v" USING btree ("updated_at");
  CREATE INDEX "_book_club_sessions_v_latest_idx" ON "_book_club_sessions_v" USING btree ("latest");
  CREATE UNIQUE INDEX "merch_slug_idx" ON "merch" USING btree ("slug");
  CREATE INDEX "merch_meta_meta_image_idx" ON "merch" USING btree ("meta_image_id");
  CREATE INDEX "merch_updated_at_idx" ON "merch" USING btree ("updated_at");
  CREATE INDEX "merch_created_at_idx" ON "merch" USING btree ("created_at");
  CREATE INDEX "merch__status_idx" ON "merch" USING btree ("_status");
  CREATE INDEX "merch_rels_order_idx" ON "merch_rels" USING btree ("order");
  CREATE INDEX "merch_rels_parent_idx" ON "merch_rels" USING btree ("parent_id");
  CREATE INDEX "merch_rels_path_idx" ON "merch_rels" USING btree ("path");
  CREATE INDEX "merch_rels_media_id_idx" ON "merch_rels" USING btree ("media_id");
  CREATE INDEX "_merch_v_parent_idx" ON "_merch_v" USING btree ("parent_id");
  CREATE INDEX "_merch_v_version_version_slug_idx" ON "_merch_v" USING btree ("version_slug");
  CREATE INDEX "_merch_v_version_meta_version_meta_image_idx" ON "_merch_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_merch_v_version_version_updated_at_idx" ON "_merch_v" USING btree ("version_updated_at");
  CREATE INDEX "_merch_v_version_version_created_at_idx" ON "_merch_v" USING btree ("version_created_at");
  CREATE INDEX "_merch_v_version_version__status_idx" ON "_merch_v" USING btree ("version__status");
  CREATE INDEX "_merch_v_created_at_idx" ON "_merch_v" USING btree ("created_at");
  CREATE INDEX "_merch_v_updated_at_idx" ON "_merch_v" USING btree ("updated_at");
  CREATE INDEX "_merch_v_latest_idx" ON "_merch_v" USING btree ("latest");
  CREATE INDEX "_merch_v_rels_order_idx" ON "_merch_v_rels" USING btree ("order");
  CREATE INDEX "_merch_v_rels_parent_idx" ON "_merch_v_rels" USING btree ("parent_id");
  CREATE INDEX "_merch_v_rels_path_idx" ON "_merch_v_rels" USING btree ("path");
  CREATE INDEX "_merch_v_rels_media_id_idx" ON "_merch_v_rels" USING btree ("media_id");
  CREATE INDEX "studio_services_inclusions_order_idx" ON "studio_services_inclusions" USING btree ("_order");
  CREATE INDEX "studio_services_inclusions_parent_id_idx" ON "studio_services_inclusions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "studio_services_slug_idx" ON "studio_services" USING btree ("slug");
  CREATE INDEX "studio_services_updated_at_idx" ON "studio_services" USING btree ("updated_at");
  CREATE INDEX "studio_services_created_at_idx" ON "studio_services" USING btree ("created_at");
  CREATE INDEX "studio_services__status_idx" ON "studio_services" USING btree ("_status");
  CREATE INDEX "studio_services_rels_order_idx" ON "studio_services_rels" USING btree ("order");
  CREATE INDEX "studio_services_rels_parent_idx" ON "studio_services_rels" USING btree ("parent_id");
  CREATE INDEX "studio_services_rels_path_idx" ON "studio_services_rels" USING btree ("path");
  CREATE INDEX "studio_services_rels_media_id_idx" ON "studio_services_rels" USING btree ("media_id");
  CREATE INDEX "_studio_services_v_version_inclusions_order_idx" ON "_studio_services_v_version_inclusions" USING btree ("_order");
  CREATE INDEX "_studio_services_v_version_inclusions_parent_id_idx" ON "_studio_services_v_version_inclusions" USING btree ("_parent_id");
  CREATE INDEX "_studio_services_v_parent_idx" ON "_studio_services_v" USING btree ("parent_id");
  CREATE INDEX "_studio_services_v_version_version_slug_idx" ON "_studio_services_v" USING btree ("version_slug");
  CREATE INDEX "_studio_services_v_version_version_updated_at_idx" ON "_studio_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_studio_services_v_version_version_created_at_idx" ON "_studio_services_v" USING btree ("version_created_at");
  CREATE INDEX "_studio_services_v_version_version__status_idx" ON "_studio_services_v" USING btree ("version__status");
  CREATE INDEX "_studio_services_v_created_at_idx" ON "_studio_services_v" USING btree ("created_at");
  CREATE INDEX "_studio_services_v_updated_at_idx" ON "_studio_services_v" USING btree ("updated_at");
  CREATE INDEX "_studio_services_v_latest_idx" ON "_studio_services_v" USING btree ("latest");
  CREATE INDEX "_studio_services_v_rels_order_idx" ON "_studio_services_v_rels" USING btree ("order");
  CREATE INDEX "_studio_services_v_rels_parent_idx" ON "_studio_services_v_rels" USING btree ("parent_id");
  CREATE INDEX "_studio_services_v_rels_path_idx" ON "_studio_services_v_rels" USING btree ("path");
  CREATE INDEX "_studio_services_v_rels_media_id_idx" ON "_studio_services_v_rels" USING btree ("media_id");
  CREATE INDEX "membership_plans_perks_order_idx" ON "membership_plans_perks" USING btree ("_order");
  CREATE INDEX "membership_plans_perks_parent_id_idx" ON "membership_plans_perks" USING btree ("_parent_id");
  CREATE INDEX "membership_plans_updated_at_idx" ON "membership_plans" USING btree ("updated_at");
  CREATE INDEX "membership_plans_created_at_idx" ON "membership_plans" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE INDEX "popup_campaigns_book_idx" ON "popup_campaigns" USING btree ("book_id");
  CREATE INDEX "popup_campaigns_updated_at_idx" ON "popup_campaigns" USING btree ("updated_at");
  CREATE INDEX "popup_campaigns_created_at_idx" ON "popup_campaigns" USING btree ("created_at");
  CREATE INDEX "press_mentions_logo_idx" ON "press_mentions" USING btree ("logo_id");
  CREATE INDEX "press_mentions_updated_at_idx" ON "press_mentions" USING btree ("updated_at");
  CREATE INDEX "press_mentions_created_at_idx" ON "press_mentions" USING btree ("created_at");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE INDEX "partnership_enquiries_updated_at_idx" ON "partnership_enquiries" USING btree ("updated_at");
  CREATE INDEX "partnership_enquiries_created_at_idx" ON "partnership_enquiries" USING btree ("created_at");
  CREATE INDEX "bookstore_applications_updated_at_idx" ON "bookstore_applications" USING btree ("updated_at");
  CREATE INDEX "bookstore_applications_created_at_idx" ON "bookstore_applications" USING btree ("created_at");
  CREATE INDEX "advisory_enquiries_updated_at_idx" ON "advisory_enquiries" USING btree ("updated_at");
  CREATE INDEX "advisory_enquiries_created_at_idx" ON "advisory_enquiries" USING btree ("created_at");
  CREATE INDEX "manuscript_submissions_call_idx" ON "manuscript_submissions" USING btree ("call_id");
  CREATE INDEX "manuscript_submissions_file_idx" ON "manuscript_submissions" USING btree ("file_id");
  CREATE INDEX "manuscript_submissions_updated_at_idx" ON "manuscript_submissions" USING btree ("updated_at");
  CREATE INDEX "manuscript_submissions_created_at_idx" ON "manuscript_submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_manuscripts_id_idx" ON "payload_locked_documents_rels" USING btree ("manuscripts_id");
  CREATE INDEX "payload_locked_documents_rels_writers_id_idx" ON "payload_locked_documents_rels" USING btree ("writers_id");
  CREATE INDEX "payload_locked_documents_rels_books_id_idx" ON "payload_locked_documents_rels" USING btree ("books_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_podcast_shows_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_shows_id");
  CREATE INDEX "payload_locked_documents_rels_podcast_episodes_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_episodes_id");
  CREATE INDEX "payload_locked_documents_rels_submission_calls_id_idx" ON "payload_locked_documents_rels" USING btree ("submission_calls_id");
  CREATE INDEX "payload_locked_documents_rels_awards_id_idx" ON "payload_locked_documents_rels" USING btree ("awards_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_careers_id_idx" ON "payload_locked_documents_rels" USING btree ("careers_id");
  CREATE INDEX "payload_locked_documents_rels_book_club_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("book_club_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_merch_id_idx" ON "payload_locked_documents_rels" USING btree ("merch_id");
  CREATE INDEX "payload_locked_documents_rels_studio_services_id_idx" ON "payload_locked_documents_rels" USING btree ("studio_services_id");
  CREATE INDEX "payload_locked_documents_rels_membership_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("membership_plans_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");
  CREATE INDEX "payload_locked_documents_rels_popup_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("popup_campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_press_mentions_id_idx" ON "payload_locked_documents_rels" USING btree ("press_mentions_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_partnership_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("partnership_enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_bookstore_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("bookstore_applications_id");
  CREATE INDEX "payload_locked_documents_rels_advisory_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("advisory_enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_manuscript_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("manuscript_submissions_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "page_home_hero_image_idx" ON "page_home" USING btree ("hero_image_id");
  CREATE INDEX "page_home_meta_meta_image_idx" ON "page_home" USING btree ("meta_image_id");
  CREATE INDEX "page_publishing_hero_image_idx" ON "page_publishing" USING btree ("hero_image_id");
  CREATE INDEX "page_publishing_meta_meta_image_idx" ON "page_publishing" USING btree ("meta_image_id");
  CREATE INDEX "page_writers_hero_image_idx" ON "page_writers" USING btree ("hero_image_id");
  CREATE INDEX "page_writers_meta_meta_image_idx" ON "page_writers" USING btree ("meta_image_id");
  CREATE INDEX "page_submissions_hero_image_idx" ON "page_submissions" USING btree ("hero_image_id");
  CREATE INDEX "page_submissions_meta_meta_image_idx" ON "page_submissions" USING btree ("meta_image_id");
  CREATE INDEX "page_awards_hero_image_idx" ON "page_awards" USING btree ("hero_image_id");
  CREATE INDEX "page_awards_meta_meta_image_idx" ON "page_awards" USING btree ("meta_image_id");
  CREATE INDEX "page_advisory_hero_image_idx" ON "page_advisory" USING btree ("hero_image_id");
  CREATE INDEX "page_advisory_meta_meta_image_idx" ON "page_advisory" USING btree ("meta_image_id");
  CREATE INDEX "page_distribution_hero_image_idx" ON "page_distribution" USING btree ("hero_image_id");
  CREATE INDEX "page_distribution_meta_meta_image_idx" ON "page_distribution" USING btree ("meta_image_id");
  CREATE INDEX "page_studio_hero_image_idx" ON "page_studio" USING btree ("hero_image_id");
  CREATE INDEX "page_studio_meta_meta_image_idx" ON "page_studio" USING btree ("meta_image_id");
  CREATE INDEX "page_blog_hero_image_idx" ON "page_blog" USING btree ("hero_image_id");
  CREATE INDEX "page_blog_meta_meta_image_idx" ON "page_blog" USING btree ("meta_image_id");
  CREATE INDEX "page_podcast_hero_image_idx" ON "page_podcast" USING btree ("hero_image_id");
  CREATE INDEX "page_podcast_meta_meta_image_idx" ON "page_podcast" USING btree ("meta_image_id");
  CREATE INDEX "page_shop_hero_image_idx" ON "page_shop" USING btree ("hero_image_id");
  CREATE INDEX "page_shop_meta_meta_image_idx" ON "page_shop" USING btree ("meta_image_id");
  CREATE INDEX "page_book_club_hero_image_idx" ON "page_book_club" USING btree ("hero_image_id");
  CREATE INDEX "page_book_club_meta_meta_image_idx" ON "page_book_club" USING btree ("meta_image_id");
  CREATE INDEX "page_membership_hero_image_idx" ON "page_membership" USING btree ("hero_image_id");
  CREATE INDEX "page_membership_meta_meta_image_idx" ON "page_membership" USING btree ("meta_image_id");
  CREATE INDEX "page_events_hero_image_idx" ON "page_events" USING btree ("hero_image_id");
  CREATE INDEX "page_events_meta_meta_image_idx" ON "page_events" USING btree ("meta_image_id");
  CREATE INDEX "page_careers_hero_image_idx" ON "page_careers" USING btree ("hero_image_id");
  CREATE INDEX "page_careers_meta_meta_image_idx" ON "page_careers" USING btree ("meta_image_id");
  CREATE INDEX "page_who_we_are_hero_image_idx" ON "page_who_we_are" USING btree ("hero_image_id");
  CREATE INDEX "page_who_we_are_meta_meta_image_idx" ON "page_who_we_are" USING btree ("meta_image_id");
  CREATE INDEX "page_press_hero_image_idx" ON "page_press" USING btree ("hero_image_id");
  CREATE INDEX "page_press_meta_meta_image_idx" ON "page_press" USING btree ("meta_image_id");
  CREATE INDEX "page_contact_hero_image_idx" ON "page_contact" USING btree ("hero_image_id");
  CREATE INDEX "page_contact_meta_meta_image_idx" ON "page_contact" USING btree ("meta_image_id");
  CREATE INDEX "page_partner_hero_image_idx" ON "page_partner" USING btree ("hero_image_id");
  CREATE INDEX "page_partner_meta_meta_image_idx" ON "page_partner" USING btree ("meta_image_id");
  CREATE INDEX "page_support_hero_image_idx" ON "page_support" USING btree ("hero_image_id");
  CREATE INDEX "page_support_meta_meta_image_idx" ON "page_support" USING btree ("meta_image_id");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_default_share_image_idx" ON "site_settings" USING btree ("default_share_image_id");
  CREATE INDEX "shop_settings_flat_delivery_prices_order_idx" ON "shop_settings_flat_delivery_prices" USING btree ("_order");
  CREATE INDEX "shop_settings_flat_delivery_prices_parent_id_idx" ON "shop_settings_flat_delivery_prices" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "manuscripts" CASCADE;
  DROP TABLE "writers_links" CASCADE;
  DROP TABLE "writers" CASCADE;
  DROP TABLE "_writers_v_version_links" CASCADE;
  DROP TABLE "_writers_v" CASCADE;
  DROP TABLE "books_formats" CASCADE;
  DROP TABLE "books" CASCADE;
  DROP TABLE "books_rels" CASCADE;
  DROP TABLE "_books_v_version_formats" CASCADE;
  DROP TABLE "_books_v" CASCADE;
  DROP TABLE "_books_v_rels" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "podcast_shows" CASCADE;
  DROP TABLE "podcast_episodes" CASCADE;
  DROP TABLE "podcast_episodes_rels" CASCADE;
  DROP TABLE "_podcast_episodes_v" CASCADE;
  DROP TABLE "_podcast_episodes_v_rels" CASCADE;
  DROP TABLE "submission_calls" CASCADE;
  DROP TABLE "_submission_calls_v" CASCADE;
  DROP TABLE "awards_key_dates" CASCADE;
  DROP TABLE "awards_past_winners" CASCADE;
  DROP TABLE "awards" CASCADE;
  DROP TABLE "_awards_v_version_key_dates" CASCADE;
  DROP TABLE "_awards_v_version_past_winners" CASCADE;
  DROP TABLE "_awards_v" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "careers" CASCADE;
  DROP TABLE "_careers_v" CASCADE;
  DROP TABLE "book_club_sessions" CASCADE;
  DROP TABLE "_book_club_sessions_v" CASCADE;
  DROP TABLE "merch" CASCADE;
  DROP TABLE "merch_rels" CASCADE;
  DROP TABLE "_merch_v" CASCADE;
  DROP TABLE "_merch_v_rels" CASCADE;
  DROP TABLE "studio_services_inclusions" CASCADE;
  DROP TABLE "studio_services" CASCADE;
  DROP TABLE "studio_services_rels" CASCADE;
  DROP TABLE "_studio_services_v_version_inclusions" CASCADE;
  DROP TABLE "_studio_services_v" CASCADE;
  DROP TABLE "_studio_services_v_rels" CASCADE;
  DROP TABLE "membership_plans_perks" CASCADE;
  DROP TABLE "membership_plans" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "popup_campaigns" CASCADE;
  DROP TABLE "press_mentions" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "partnership_enquiries" CASCADE;
  DROP TABLE "bookstore_applications" CASCADE;
  DROP TABLE "advisory_enquiries" CASCADE;
  DROP TABLE "manuscript_submissions" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "page_home" CASCADE;
  DROP TABLE "page_publishing" CASCADE;
  DROP TABLE "page_writers" CASCADE;
  DROP TABLE "page_submissions" CASCADE;
  DROP TABLE "page_awards" CASCADE;
  DROP TABLE "page_advisory" CASCADE;
  DROP TABLE "page_distribution" CASCADE;
  DROP TABLE "page_studio" CASCADE;
  DROP TABLE "page_blog" CASCADE;
  DROP TABLE "page_podcast" CASCADE;
  DROP TABLE "page_shop" CASCADE;
  DROP TABLE "page_book_club" CASCADE;
  DROP TABLE "page_membership" CASCADE;
  DROP TABLE "page_events" CASCADE;
  DROP TABLE "page_careers" CASCADE;
  DROP TABLE "page_who_we_are" CASCADE;
  DROP TABLE "page_press" CASCADE;
  DROP TABLE "page_contact" CASCADE;
  DROP TABLE "page_partner" CASCADE;
  DROP TABLE "page_support" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "shop_settings_flat_delivery_prices" CASCADE;
  DROP TABLE "shop_settings" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_writers_status";
  DROP TYPE "public"."enum__writers_v_version_status";
  DROP TYPE "public"."enum_books_category";
  DROP TYPE "public"."enum_books_status";
  DROP TYPE "public"."enum__books_v_version_category";
  DROP TYPE "public"."enum__books_v_version_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_podcast_episodes_status";
  DROP TYPE "public"."enum__podcast_episodes_v_version_status";
  DROP TYPE "public"."enum_submission_calls_status";
  DROP TYPE "public"."enum__submission_calls_v_version_status";
  DROP TYPE "public"."award_status";
  DROP TYPE "public"."enum_awards_status";
  DROP TYPE "public"."enum__awards_v_version_status";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_careers_type";
  DROP TYPE "public"."enum_careers_status";
  DROP TYPE "public"."enum__careers_v_version_type";
  DROP TYPE "public"."enum__careers_v_version_status";
  DROP TYPE "public"."enum_book_club_sessions_status";
  DROP TYPE "public"."enum__book_club_sessions_v_version_status";
  DROP TYPE "public"."enum_merch_type";
  DROP TYPE "public"."enum_merch_status";
  DROP TYPE "public"."enum__merch_v_version_type";
  DROP TYPE "public"."enum__merch_v_version_status";
  DROP TYPE "public"."enum_studio_services_status";
  DROP TYPE "public"."enum__studio_services_v_version_status";
  DROP TYPE "public"."enum_membership_plans_billing";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_contact_messages_status";
  DROP TYPE "public"."enum_partnership_enquiries_partnership_type";
  DROP TYPE "public"."enum_partnership_enquiries_status";
  DROP TYPE "public"."enum_bookstore_applications_store_type";
  DROP TYPE "public"."enum_bookstore_applications_status";
  DROP TYPE "public"."enum_advisory_enquiries_status";
  DROP TYPE "public"."enum_manuscript_submissions_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_site_settings_social_links_platform";`)
}
