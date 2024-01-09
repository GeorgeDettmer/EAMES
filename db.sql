-- Adminer 4.8.1 PostgreSQL 15.2 (Debian 15.2-1.pgdg110+1) dump

DROP TABLE IF EXISTS "assemblies";
DROP SEQUENCE IF EXISTS assemblies_id_seq;
CREATE SEQUENCE assemblies_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 97 CACHE 1;

CREATE TABLE "public"."assemblies" (
    "id" bigint DEFAULT nextval('assemblies_id_seq') NOT NULL,
    "name" text NOT NULL,
    "revision_internal" integer DEFAULT '1' NOT NULL,
    "revision_external" character varying,
    "cad_id" uuid,
    "meta" json,
    "kb" uuid DEFAULT gen_random_uuid(),
    "bom_id" uuid,
    CONSTRAINT "assemblies_kb_key" UNIQUE ("kb"),
    CONSTRAINT "assemblies_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "assembly_instructions";
CREATE TABLE "public"."assembly_instructions" (
    "assembly_id" bigint NOT NULL,
    "instruction_id" uuid NOT NULL,
    CONSTRAINT "assembly_instructions_pkey" PRIMARY KEY ("assembly_id", "instruction_id")
) WITH (oids = false);


DROP TABLE IF EXISTS "boards";
DROP SEQUENCE IF EXISTS boards_id_seq;
CREATE SEQUENCE boards_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 61 CACHE 1;

CREATE TABLE "public"."boards" (
    "id" bigint DEFAULT nextval('boards_id_seq') NOT NULL,
    "assembly_id" bigint NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "signoffs" json,
    "job_id" integer,
    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "bom";
CREATE TABLE "public"."bom" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "revision_internal" integer DEFAULT '1' NOT NULL,
    "revision_external" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "meta" json,
    CONSTRAINT "bom_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_bom_updated_at" BEFORE UPDATE ON "public"."bom" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "bom_lines";
CREATE TABLE "public"."bom_lines" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "part" text,
    "reference" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "bom_id" uuid NOT NULL,
    "description" text,
    "quantity" integer,
    CONSTRAINT "bom_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bom_lines_reference_id_key" UNIQUE ("reference", "id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_bom_lines_updated_at" BEFORE UPDATE ON "public"."bom_lines" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "cad";
CREATE TABLE "public"."cad" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "data" json,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "name" text,
    "start_x" integer,
    "start_y" integer,
    "start_scale" integer,
    "layers" json,
    "meta" json,
    "revision_external" text,
    "revision_internal" integer,
    CONSTRAINT "cad_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_cad_updated_at" BEFORE UPDATE ON "public"."cad" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "customers";
DROP SEQUENCE IF EXISTS customers_id_seq;
CREATE SEQUENCE customers_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 39 CACHE 1;

CREATE TABLE "public"."customers" (
    "id" bigint DEFAULT nextval('customers_id_seq') NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "meta" jsonb,
    "user_id" uuid,
    CONSTRAINT "customers_id_key" UNIQUE ("id"),
    CONSTRAINT "customers_name_key" UNIQUE ("name"),
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "flows";
CREATE TABLE "public"."flows" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "revision" integer DEFAULT '0' NOT NULL,
    "active" boolean DEFAULT false NOT NULL,
    "instructions" int2vector,
    "flow" json,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "flows_name_revision_key" UNIQUE ("name", "revision"),
    CONSTRAINT "flows_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_flows_updated_at" BEFORE UPDATE ON "public"."flows" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "history";
DROP SEQUENCE IF EXISTS history_id_seq;
CREATE SEQUENCE history_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 886 CACHE 1;

CREATE TABLE "public"."history" (
    "id" integer DEFAULT nextval('history_id_seq') NOT NULL,
    "tstamp" timestamp DEFAULT now(),
    "schemaname" text,
    "tabname" text,
    "operation" text,
    "who" text DEFAULT 'CURRENT_USER',
    "new_val" jsonb,
    "old_val" jsonb,
    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "instructions";
CREATE TABLE "public"."instructions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "revision" integer DEFAULT '0' NOT NULL,
    "active" boolean DEFAULT false NOT NULL,
    "description" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "type" text,
    "meta" json,
    "dynamic" boolean DEFAULT false NOT NULL,
    CONSTRAINT "instructions_name_revision_key" UNIQUE ("name", "revision"),
    CONSTRAINT "instructions_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_instructions_updated_at" BEFORE UPDATE ON "public"."instructions" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "jobs";
DROP SEQUENCE IF EXISTS jobs_id_seq;
CREATE SEQUENCE jobs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 9 CACHE 1;

CREATE TABLE "public"."jobs" (
    "id" bigint DEFAULT nextval('jobs_id_seq') NOT NULL,
    "batch" integer DEFAULT '0' NOT NULL,
    "customer_id" bigint NOT NULL,
    "assembly_id" bigint,
    "quantity" integer DEFAULT '1' NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "kit_id" uuid,
    CONSTRAINT "jobs_id_batch_key" UNIQUE ("id", "batch"),
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "kb";
DROP SEQUENCE IF EXISTS kb_id_seq;
CREATE SEQUENCE kb_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 46 CACHE 1;

CREATE TABLE "public"."kb" (
    "id" integer DEFAULT nextval('kb_id_seq') NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "content" text,
    "images" json,
    "user_id" uuid,
    "kb_id" uuid NOT NULL,
    CONSTRAINT "kb_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_kb_updated_at" BEFORE UPDATE ON "public"."kb" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "kb_comments";
DROP SEQUENCE IF EXISTS kb_comments_id_seq;
CREATE SEQUENCE kb_comments_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 7 CACHE 1;

CREATE TABLE "public"."kb_comments" (
    "id" bigint DEFAULT nextval('kb_comments_id_seq') NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "content" text NOT NULL,
    "user_id" uuid NOT NULL,
    "images" json,
    "kb_id" integer NOT NULL,
    CONSTRAINT "kb_comments_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_kb_comments_updated_at" BEFORE UPDATE ON "public"."kb_comments" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "notifications";
CREATE TABLE "public"."notifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "content" text,
    "heading" text,
    "meta" json,
    "actioned_user_id" uuid,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "parts";
CREATE TABLE "public"."parts" (
    "id" text NOT NULL,
    "level" integer DEFAULT '0' NOT NULL,
    "part_data_id" text,
    "name" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "parts_pkey1" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_parts_updated_at" BEFORE UPDATE ON "public"."parts" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "parts_data";
CREATE TABLE "public"."parts_data" (
    "id" text NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "properties" json,
    "image_url" text,
    "manufacturer" text,
    "polarised" boolean,
    "kb" uuid DEFAULT gen_random_uuid() NOT NULL,
    "images" json,
    "footprint" json,
    CONSTRAINT "parts_kb_key" UNIQUE ("kb"),
    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_parts_updated_at" BEFORE UPDATE ON "public"."parts_data" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "signoffs";
CREATE TABLE "public"."signoffs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "board_id" bigint NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "user_id" uuid NOT NULL,
    "step_id" uuid,
    CONSTRAINT "signoffs_id_key" UNIQUE ("id"),
    CONSTRAINT "signoffs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "add_history" BEFORE DELETE OR INSERT OR UPDATE ON "public"."signoffs" FOR EACH ROW EXECUTE FUNCTION add_history();;

CREATE TRIGGER "set_public_signoffs_updated_at" BEFORE UPDATE ON "public"."signoffs" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "steps";
CREATE TABLE "public"."steps" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "instruction_id" uuid NOT NULL,
    "assembly_id" bigint,
    "reference" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "part_id" text,
    "notes" text,
    "color" text DEFAULT 'blue-600',
    "position" json,
    "dynamic" boolean,
    "meta" json,
    "user_id" uuid,
    "board_id" bigint,
    CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "users";
CREATE TABLE "public"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "initials" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "username" text NOT NULL,
    "passcode" text,
    "password" text,
    "last_active" timestamptz DEFAULT now(),
    "color" text,
    "permissions" json,
    "processes" json,
    "active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "users_first_name_last_name_key" UNIQUE ("first_name", "last_name"),
    CONSTRAINT "users_initials_color_key" UNIQUE ("initials", "color"),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_username_key" UNIQUE ("username")
) WITH (oids = false);


DELIMITER ;;

CREATE TRIGGER "set_public_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();;

DELIMITER ;

DROP TABLE IF EXISTS "users_notifications";
CREATE TABLE "public"."users_notifications" (
    "notification_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "users_notifications_pkey" PRIMARY KEY ("notification_id", "user_id")
) WITH (oids = false);


DROP TABLE IF EXISTS "users_tokens";
CREATE TABLE "public"."users_tokens" (
    "token" text NOT NULL,
    "user_id" uuid NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "expires_at" timestamptz,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "users_tokens_pkey" PRIMARY KEY ("token"),
    CONSTRAINT "users_tokens_token_key" UNIQUE ("token")
) WITH (oids = false);


ALTER TABLE ONLY "public"."assemblies" ADD CONSTRAINT "assemblies_bom_id_fkey" FOREIGN KEY (bom_id) REFERENCES bom(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."assemblies" ADD CONSTRAINT "assemblies_cad_id_fkey" FOREIGN KEY (cad_id) REFERENCES cad(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."assembly_instructions" ADD CONSTRAINT "assembly_instructions_assembly_id_fkey" FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."assembly_instructions" ADD CONSTRAINT "assembly_instructions_instruction_id_fkey" FOREIGN KEY (instruction_id) REFERENCES instructions(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."boards" ADD CONSTRAINT "boards_assembly_id_fkey" FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."boards" ADD CONSTRAINT "boards_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."bom_lines" ADD CONSTRAINT "bom_lines_bom_id_fkey" FOREIGN KEY (bom_id) REFERENCES bom(id) ON UPDATE RESTRICT ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."bom_lines" ADD CONSTRAINT "bom_lines_part_fkey" FOREIGN KEY (part) REFERENCES parts_data(id) ON UPDATE SET NULL ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."jobs" ADD CONSTRAINT "jobs_assembly_id_fkey" FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."jobs" ADD CONSTRAINT "jobs_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."jobs" ADD CONSTRAINT "jobs_kit_id_fkey" FOREIGN KEY (kit_id) REFERENCES erp.kits(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."kb" ADD CONSTRAINT "kb_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."kb_comments" ADD CONSTRAINT "kb_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."notifications" ADD CONSTRAINT "notifications_actioned_user_id_fkey" FOREIGN KEY (actioned_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."parts" ADD CONSTRAINT "parts_part_data_id_fkey" FOREIGN KEY (part_data_id) REFERENCES parts_data(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."signoffs" ADD CONSTRAINT "signoffs_board_id_fkey" FOREIGN KEY (board_id) REFERENCES boards(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."signoffs" ADD CONSTRAINT "signoffs_step_id_fkey" FOREIGN KEY (step_id) REFERENCES steps(id) ON UPDATE RESTRICT ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."signoffs" ADD CONSTRAINT "signoffs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."steps" ADD CONSTRAINT "steps_assembly_id_fkey" FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."steps" ADD CONSTRAINT "steps_instruction_id_fkey" FOREIGN KEY (instruction_id) REFERENCES instructions(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;
ALTER TABLE ONLY "public"."steps" ADD CONSTRAINT "steps_part_id_fkey" FOREIGN KEY (part_id) REFERENCES parts_data(id) ON UPDATE SET NULL ON DELETE SET NULL NOT DEFERRABLE;
ALTER TABLE ONLY "public"."steps" ADD CONSTRAINT "steps_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE SET NULL ON DELETE SET NULL NOT DEFERRABLE;

ALTER TABLE ONLY "public"."users_notifications" ADD CONSTRAINT "users_notifications_notification_id_fkey" FOREIGN KEY (notification_id) REFERENCES notifications(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."users_notifications" ADD CONSTRAINT "users_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT NOT DEFERRABLE;

ALTER TABLE ONLY "public"."users_tokens" ADD CONSTRAINT "users_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE;

-- 2024-01-09 10:03:33.644949+00

INSERT INTO "users" ("id", "first_name", "last_name", "initials", "created_at", "updated_at", "username", "passcode", "password", "last_active", "color", "permissions", "processes", "active") VALUES
('9d926336-b4f0-4d4d-8985-4c1f02af3637',	'George',	'Dettmer',	'GD',	'2023-06-06 19:19:37.665561+00',	'2024-01-03 14:03:20.158271+00',	'GDettmer',	'2253',	'password',	'2023-06-06 19:22:43.271521+00',	'#0099ff',	'{"admin":true}',	'{"aoi":true,"eng":true,"fa":true,"purchase":{"suppliers":{"tags":{"greymarket":false}}},"rwk":true,"smi":true,"smt":true,"tester":true,"tht":true,"xray":true}',	't');