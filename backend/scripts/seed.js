const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Inquiry = require('../src/models/Inquiry');
const Project = require('../src/models/Project');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silent_house';

const seedData = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seed');

    await User.deleteMany({});
    await Inquiry.deleteMany({});
    await Project.deleteMany({});

    const passwordA = await bcrypt.hash('password123', 10);
    const passwordB = await bcrypt.hash('admin123', 10);

    const users = await User.insertMany([
      {
        name: 'Ava Carter',
        email: 'ava@example.com',
        password: passwordA,
        role: 'user',
      },
      {
        name: 'Noah Patel',
        email: 'noah@example.com',
        password: passwordA,
        role: 'user',
      },
      {
        name: 'Admin User',
        email: 'admin@silent-house.com',
        password: passwordB,
        role: 'admin',
      },
    ]);

    await Inquiry.insertMany([
      {
        name: 'Mia Johnson',
        email: 'mia@example.com',
        inquiryType: 'project',
        message: 'We want to discuss a large venue activation for our global campaign.',
        status: 'pending',
      },
      {
        name: 'Liam Brooks',
        email: 'liam@example.com',
        inquiryType: 'partnership',
        message: 'Interested in partnering on a touring production and brand collaboration.',
        status: 'contacted',
      },
      {
        name: 'Emma Ross',
        email: 'emma@example.com',
        inquiryType: 'general',
        message: 'Hello, we would like to learn more about Silent House and potential work together.',
        status: 'completed',
      },
    ]);

    await Project.insertMany([
      {
        title: 'Backstreet Boys — Sphere Las Vegas',
        category: 'Studios',
        slug: 'backstreet-boys-sphere-las-vegas',
        description: 'Immersive live entertainment concept and production partnership.',
        featured: true,
        image: '/images/featured-1.jpg',
        video: '',
        tags: ['concert', 'immersive', 'live'],
      },
      {
        title: 'Taylor Swift | The Eras Tour',
        category: 'Productions',
        slug: 'taylor-swift-the-eras-tour-film',
        description: 'A landmark production event and global film release.',
        featured: true,
        image: '/images/featured-2.jpg',
        video: '',
        tags: ['film', 'tour', 'production'],
      },
      {
        title: 'Tyler, The Creator — CHROMAKOPIA Tour',
        category: 'Studios',
        slug: 'tyler-the-creator-chromakopia-tour',
        description: 'Creative touring solution with spectacle and storytelling.',
        featured: true,
        image: '/images/featured-4.jpg',
        video: '',
        tags: ['tour', 'production', 'creative'],
      },
    ]);

    console.log('Seed completed successfully');
    console.log('Test users created:');
    users.forEach((user) => console.log(`- ${user.email} | password: ${user.role === 'admin' ? 'admin123' : 'password123'} | role: ${user.role}`));
    console.log('Inquiry records created:', 3);
    console.log('Project records created:', 3);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
