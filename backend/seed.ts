// seed.ts
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/kanban';

async function main() {
  console.log('⏳ Conectando ao MongoDB...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const session = null;

  try {
    const now = new Date();
    const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
    const withTimestamps = (doc: any) => ({
      ...doc,
      createdAt: now,
      updatedAt: now,
    });

    const users = db.collection('users');
    const orgs = db.collection('organizations');
    const depts = db.collection('departments');
    const columns = db.collection('columns');
    const tasks = db.collection('tasks');

    const existingAdmin = await users.findOne({
      email: 'admin2.juan@example.com',
    });

    if (existingAdmin) {
      console.log('⚠️ Usuário admin já existe. Abortando seed.');
      return;
    }

    const existingOrg = await orgs.findOne({ name: 'Ragnarok INC.' });
    if (existingOrg) {
      console.log('⚠️ Organização já existe. Abortando seed.');
      return;
    }

    // 🆔 IDs fixos para manter as relações
    const orgId = new mongoose.Types.ObjectId('6800216d958aae2d2c7238d4');
    const adminId = new mongoose.Types.ObjectId();
    const kratosId = new mongoose.Types.ObjectId();
    const vergilId = new mongoose.Types.ObjectId();
    const deptAsgardId = new mongoose.Types.ObjectId();
    const deptMidgardId = new mongoose.Types.ObjectId();
    const col1 = new mongoose.Types.ObjectId();
    const col2 = new mongoose.Types.ObjectId();
    const col3 = new mongoose.Types.ObjectId();

    // 🏢 Organização
    await orgs.insertOne(
      withTimestamps({
        _id: orgId,
        name: 'Ragnarok INC.',
        description: 'The Beginning of the End — with structure.',
        logo: 'ragnarok_logo.png',
      }),
    );

    // 👑 Usuários
    await users.insertMany(
      [
        withTimestamps({
          _id: adminId,
          name: 'Juan Vieira Admin',
          email: 'admin2.juan@example.com',
          password: hash('Test1234!'),
          roles: [{ organizationId: orgId, role: 'admin' }],
        }),
        withTimestamps({
          _id: kratosId,
          name: 'Kratos of Sparta',
          email: 'kratos@ragnarok.com',
          password: hash('leviathanAXE'),
          roles: [{ organizationId: orgId, role: 'manager' }],
        }),
        withTimestamps({
          _id: vergilId,
          name: 'Vergil Sparda',
          email: 'vergil@ragnarok.com',
          password: hash('yamato123'),
          roles: [{ organizationId: orgId, role: 'manager' }],
        }),
      ],
      { session },
    );

    // 🧩 Departamentos
    await depts.insertMany(
      [
        withTimestamps({
          _id: deptAsgardId,
          name: 'Asgard',
          description:
            'Oversight of divine retribution, combat logistics and godsmashing.',
          organizationId: orgId,
        }),
        withTimestamps({
          _id: deptMidgardId,
          name: 'Midgard',
          description:
            'Oversight of mortal operations, demonic negotiations and motivation.',
          organizationId: orgId,
        }),
      ],
      { session },
    );

    // 📦 Colunas
    const columnNames = [
      'Aquisition (Tarefas Disponíveis)',
      'In Progress',
      'Completed',
    ];
    const existingColumns = await columns.countDocuments({
      departmentId: deptMidgardId,
      name: { $in: columnNames },
    });

    if (existingColumns > 0) {
      console.log('⚠️ Colunas de Midgard já existem. Abortando seed.');
      return;
    }

    await columns.insertMany(
      [
        withTimestamps({
          _id: col1,
          name: columnNames[0],
          color: '#3B82F6',
          departmentId: deptMidgardId,
          order: 0,
          archived: false,
        }),
        withTimestamps({
          _id: col2,
          name: columnNames[1],
          color: '#F59E0B',
          departmentId: deptMidgardId,
          order: 1,
          archived: false,
        }),
        withTimestamps({
          _id: col3,
          name: columnNames[2],
          color: '#10B981',
          departmentId: deptMidgardId,
          order: 2,
          archived: false,
        }),
      ],
      { session },
    );

    // ✅ Tarefas
    await tasks.insertMany(
      [
        withTimestamps({
          name: 'Recruit Cerberus Clan',
          description:
            'Negotiate with the three-headed gatekeepers of hell. Bring bones.',
          attachments: ['cerberus_contract.pdf'],
          columnId: col2,
          assignedTo: vergilId,
        }),
        withTimestamps({
          name: 'Forge Alliance with Ferrum Lords',
          description:
            "Secure blacksmithing expertise for Midgard's operations.",
          attachments: ['ferrum_offer.docx'],
          columnId: col2,
          assignedTo: vergilId,
        }),
        withTimestamps({
          name: 'Scout Demon Clans',
          description:
            'Identify potential allies. Avoid direct confrontation... for now.',
          attachments: ['scouting_report.txt'],
          columnId: col1,
          assignedTo: null,
        }),
      ],
      { session },
    );

    console.log('✅ Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed. Revertendo...', error);
  } finally {
    console.log('📦 MongoDB desconectado.');
  }
}

main();
