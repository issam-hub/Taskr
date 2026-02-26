import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Roles {
  @PrimaryGeneratedColumn("uuid")
  role_id: string;

  @Column({ length: 60, nullable: false, unique: true })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column("varchar", { array: true, default: [] })
  rights: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
