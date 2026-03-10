import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Projects } from "../projects/entity.js";
import { Users } from "../users/entity.js";
export enum Status {
  NotStarted = "Not-Started",
  InProgress = "In-Progress",
  Completed = "Completed",
}
export enum Priority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}
@Entity()
export class Tasks {
  @PrimaryGeneratedColumn("uuid")
  task_id: string;

  @Column({ length: 30, nullable: false, unique: true })
  name: string;

  @Column({ length: 500 })
  description: string;

  @Column({ nullable: false })
  @ManyToOne(() => Projects)
  @JoinColumn({ name: "project_id" })
  project_id: Projects["project_id"];

  @Column({ nullable: false })
  @ManyToOne(() => Users)
  @JoinColumn({ name: "user_id" })
  user_id: Users["user_id"];

  @Column()
  estimated_start_time: Date;

  @Column()
  estimated_end_time: Date;

  @Column({ nullable: true })
  actual_start_time: Date;

  @Column({ nullable: true })
  actual_end_time: Date;

  @Column({
    type: "enum",
    enum: Priority,
    default: Priority.Low,
  })
  priority: Priority;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.NotStarted,
  })
  status: Status;

  @Column("text", { array: true, default: [] })
  supported_files: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
