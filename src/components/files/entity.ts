import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Tasks } from "../tasks/entity.js";
import { Users } from "../users/entity.js";
import { Comments } from "../comments/entity.js";

@Entity()
export class Files {
  @PrimaryGeneratedColumn("uuid")
  file_id: string;

  @Column({ length: 30, nullable: false, unique: true })
  file_name: string;

  @Column({ length: 30 })
  mime_type: string;

  @Column()
  url: string;

  @ManyToOne(() => Users, (userData) => userData.user_id)
  @JoinColumn({ name: "user_id" })
  created_by: string;

  @ManyToOne(() => Tasks, (taskData) => taskData.task_id, { nullable: true })
  @JoinColumn({ name: "task_id" })
  task_id: string;

  @ManyToOne(() => Comments, (commentData) => commentData.comment_id, { nullable: true })
  @JoinColumn({ name: "comment_id" })
  comment_id: string;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Column()
  @UpdateDateColumn()
  updated_at: Date;
}
