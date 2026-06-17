import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Delete in correct order (children before parents)
    await prisma.employeeSkillTopicSelection.deleteMany({});
    await prisma.employeeSkillTopic.deleteMany({});
    await prisma.employeeSkill.deleteMany({});
    await prisma.approvalRequest.deleteMany({});
    await prisma.skillTopic.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.user.deleteMany({});

    const defaultPassword = await bcrypt.hash('Demo123', 10);

    // 1. Create Admin (MD)
    const admin = await prisma.user.create({
        data: {
            name: 'Vijay Malhotra',
            email: 'admin@suprajit.com',
            password_hash: defaultPassword,
            role: 'ADMIN',
            category: 'MANAGEMENT',
            stream: 'Corporate',
            department: 'Executive',
            designation: 'Managing Director',
            date_of_joining: new Date('2015-01-01'),
            years_of_experience: 30,
            must_change_password: false,
        },
    });

    // 2. Create CTO
    const cto = await prisma.user.create({
        data: {
            name: 'Priya Sharma',
            email: 'cto@suprajit.com',
            password_hash: defaultPassword,
            role: 'CTO',
            category: 'MANAGEMENT',
            stream: 'Technology',
            department: 'IT',
            designation: 'Chief Technology Officer',
            manager_id: admin.id,
            date_of_joining: new Date('2016-03-15'),
            years_of_experience: 22,
            must_change_password: false,
        },
    });

    // 3. Create 4 Department Heads
    const deptHeadNames = [
        { name: 'Rajesh Kumar', dept: 'Embedded Software', stream: 'Automotive Software', platform: 'CORE' },
        { name: 'Anita Desai', dept: 'ECU Hardware', stream: 'Electronics Design', platform: 'CORE' },
        { name: 'Suresh Reddy', dept: 'Testing & Validation', stream: 'Quality Engineering', platform: 'COMMERCIAL' },
        { name: 'Meena Iyer', dept: 'AUTOSAR & Integration', stream: 'System Integration', platform: 'COMMERCIAL' },
    ];

    const deptHeads = [];
    for (const [idx, dh] of deptHeadNames.entries()) {
        const user = await prisma.user.create({
            data: {
                name: dh.name,
                email: `depthead${idx + 1}@suprajit.com`,
                password_hash: defaultPassword,
                role: 'DEPARTMENT_HEAD',
                category: 'MANAGEMENT',
                platform: dh.platform,
                stream: dh.stream,
                department: dh.dept,
                designation: 'Department Head',
                manager_id: cto.id,
                date_of_joining: new Date(2017 + idx, 6, 1),
                years_of_experience: 18 - idx,
                must_change_password: false,
            },
        });
        deptHeads.push(user);
    }

    // 4. Create 8 Managers (2 per department)
    const managerData = [
        { name: 'Harish Nair', dept: 'Embedded Software', stream: 'Application Layer', category: 'SW', platform: 'CORE', project: 'Body Control Module' },
        { name: 'Kavita Menon', dept: 'Embedded Software', stream: 'BSW Development', category: 'SW', platform: 'CORE', project: 'AUTOSAR Stack' },
        { name: 'Vikram Singh', dept: 'ECU Hardware', stream: 'MCU Design', category: 'HW', platform: 'CORE', project: 'Gateway ECU' },
        { name: 'Deepa Rao', dept: 'ECU Hardware', stream: 'Power Electronics', category: 'HW', platform: 'CORE', project: 'Battery Management System' },
        { name: 'Arun Gupta', dept: 'Testing & Validation', stream: 'HIL Testing', category: 'DEVOPS', platform: 'COMMERCIAL', project: 'Powertrain Validation' },
        { name: 'Pooja Joshi', dept: 'Testing & Validation', stream: 'Functional Testing', category: 'DEVOPS', platform: 'COMMERCIAL', project: 'CAN Network Testing' },
        { name: 'Ramesh Pillai', dept: 'AUTOSAR & Integration', stream: 'Configuration', category: 'SW', platform: 'COMMERCIAL', project: 'RTE Generation' },
        { name: 'Sneha Kapoor', dept: 'AUTOSAR & Integration', stream: 'Integration', category: 'SW', platform: 'COMMERCIAL', project: 'Multi-ECU System' },
    ];

    const managers = [];
    for (const [idx, mgr] of managerData.entries()) {
        const deptHeadIdx = Math.floor(idx / 2);
        const user = await prisma.user.create({
            data: {
                name: mgr.name,
                email: `manager${idx + 1}@suprajit.com`,
                password_hash: defaultPassword,
                role: 'MANAGER',
                category: mgr.category,
                platform: mgr.platform,
                stream: mgr.stream,
                department: mgr.dept,
                designation: 'Manager',
                manager_id: deptHeads[deptHeadIdx].id,
                department_head_id: deptHeads[deptHeadIdx].id,
                date_of_joining: new Date(2018 + Math.floor(idx / 2), idx % 12 + 1, 15),
                years_of_experience: 12 - Math.floor(idx / 2),
                project_name: mgr.project,
                project_role: 'Project Manager',
                must_change_password: false,
            },
        });
        managers.push(user);
    }

    // 5. Create 16 Leads (2 per manager)
    const leadNames = [
        'Nandita Roy', 'Sanjay Verma', 'Priyanka Chopra', 'Rahul Dravid',
        'Aditi Sharma', 'Kiran Bedi', 'Arjun Patel', 'Divya Narayan',
        'Nikhil Mehta', 'Ritu Singh', 'Ashok Kumar', 'Geeta Krishnan',
        'Vijay Dinanath', 'Lakshmi Narayanan', 'Rohan Das', 'Swati Mishra',
    ];

    const leads = [];
    for (const [idx, leadName] of leadNames.entries()) {
        const managerIdx = Math.floor(idx / 2);
        const manager = managers[managerIdx];
        const user = await prisma.user.create({
            data: {
                name: leadName,
                email: `lead${idx + 1}@suprajit.com`,
                password_hash: defaultPassword,
                role: 'LEAD',
                category: manager.category,
                platform: manager.platform,
                stream: manager.stream,
                department: manager.department,
                designation: 'Team Lead',
                manager_id: manager.id,
                department_head_id: manager.department_head_id,
                date_of_joining: new Date(2019 + Math.floor(idx / 4), (idx % 12) + 1, 10),
                years_of_experience: 8 - Math.floor(idx / 4),
                project_name: manager.project_name,
                project_role: 'Tech Lead',
                must_change_password: false,
            },
        });
        leads.push(user);
    }

    // 6. Create 32 Employees (2 per lead)
    const employeeNames = [
        'Dhanush Kumar', 'Anjali Patel', 'Bharat Singh', 'Chitra Menon',
        'Dinesh Rao', 'Esha Gupta', 'Farhan Khan', 'Gayatri Reddy',
        'Hari Prasad', 'Indira Nair', 'Jagan Mohan', 'Kamala Devi',
        'Lokesh Sharma', 'Madhuri Dixit', 'Naveen Kumar', 'Ojasvi Pandey',
        'Pankaj Tripathi', 'Qadir Ali', 'Radhika Apte', 'Sachin Pilot',
        'Tanvi Azmi', 'Uday Kiran', 'Vidya Balan', 'Wasim Akram',
        'Xavier Fernandes', 'Yamini Das', 'Zoya Akhtar', 'Abhishek Roy',
        'Babita Kumari', 'Chandan Sharma', 'Dhruv Sehgal', 'Ekta Kapoor',
    ];

    const employees = [];
    for (const [idx, empName] of employeeNames.entries()) {
        const leadIdx = Math.floor(idx / 2);
        const lead = leads[leadIdx];
        const manager = managers[Math.floor(leadIdx / 2)];
        const user = await prisma.user.create({
            data: {
                name: empName,
                email: `emp${idx + 1}@suprajit.com`,
                password_hash: defaultPassword,
                role: 'EMPLOYEE',
                category: lead.category,
                platform: lead.platform,
                stream: lead.stream,
                department: lead.department,
                designation: ['Engineer', 'Developer', 'Specialist', 'Analyst'][idx % 4],
                manager_id: manager.id,
                lead_id: lead.id,
                department_head_id: lead.department_head_id,
                date_of_joining: new Date(2020 + Math.floor(idx / 8), (idx % 12) + 1, (idx % 28) + 1),
                years_of_experience: Math.max(1, 6 - Math.floor(idx / 8)),
                project_name: lead.project_name,
                project_role: ['Backend Developer', 'Frontend Developer', 'QA Engineer', 'DevOps Engineer'][idx % 4],
                must_change_password: false,
            },
        });
        employees.push(user);
    }

    // 7. Create skills with topics (10 topics each, beginner to advanced)
    const skillTemplates = [
        // === EMBEDDED SYSTEMS ===
        {
            name: 'Embedded C',
            topics: [
                'Data Types & Variables',
                'Control Flow (if/else, loops)',
                'Functions & Header Files',
                'Pointers & Memory Addressing',
                'Structures & Unions',
                'Bit Manipulation',
                'Interrupt Handling',
                'DMA & Memory-Mapped I/O',
                'RTOS Integration',
                'Safety-Critical Coding (MISRA)',
            ],
        },
        {
            name: 'C++',
            topics: [
                'Variables & Data Types',
                'Control Structures & Loops',
                'Functions & Overloading',
                'Classes & Objects',
                'Inheritance & Polymorphism',
                'Templates & STL',
                'Smart Pointers & RAII',
                'Multithreading & Concurrency',
                'Design Patterns',
                'Metaprogramming & Advanced Templates',
            ],
        },
        {
            name: 'FreeRTOS',
            topics: [
                'Task Creation & Scheduling',
                'Task Priorities & Preemption',
                'Queues & Message Passing',
                'Semaphores & Mutexes',
                'Timer Management',
                'Event Groups',
                'Memory Management Schemes',
                'Interrupt Safe API Usage',
                'Low Power Modes & Tickless Idle',
                'Multi-core & SMP Configuration',
            ],
        },
        {
            name: 'I2C Protocol',
            topics: [
                'Bus Architecture (SDA, SCL)',
                'Start & Stop Conditions',
                'Addressing Modes (7-bit, 10-bit)',
                'Read/Write Operations',
                'ACK/NACK Handling',
                'Clock Stretching',
                'Multi-Master Arbitration',
                'Repeated Start Conditions',
                'Bus Error Recovery',
                'High-Speed Mode & Timing Analysis',
            ],
        },
        {
            name: 'SPI Protocol',
            topics: [
                'Bus Signals (MOSI, MISO, SCK, CS)',
                'Clock Polarity & Phase (CPOL, CPHA)',
                'Single Master Configuration',
                'Data Frame Format',
                'Full-Duplex Communication',
                'Multiple Slave Selection',
                'DMA-Based Transfers',
                'Daisy Chain Configuration',
                'Dual/Quad SPI Modes',
                'High-Speed Design Considerations',
            ],
        },
        {
            name: 'ARM Cortex-M',
            topics: [
                'Architecture Overview & Registers',
                'Memory Map & Addressing',
                'GPIO Configuration',
                'NVIC & Interrupt Priorities',
                'Timer/Counter Peripherals',
                'Clock System & PLL Configuration',
                'Low-Power Modes',
                'DMA Controller Programming',
                'MPU Configuration',
                'TrustZone & Secure Boot',
            ],
        },
        {
            name: 'UART/USART',
            topics: [
                'Serial Communication Basics',
                'Baud Rate Configuration',
                'Data Frame (Start, Data, Parity, Stop)',
                'Polling-Based TX/RX',
                'Interrupt-Driven Communication',
                'DMA-Based Transfers',
                'Flow Control (RTS/CTS)',
                'RS-232/RS-485 Interfacing',
                'LIN Bus over UART',
                'Error Detection & Recovery',
            ],
        },
        {
            name: 'PCB Design',
            topics: [
                'Schematic Capture Basics',
                'Component Footprint Libraries',
                'PCB Layer Stack-up',
                'Component Placement',
                'Signal Routing Fundamentals',
                'Power Distribution Network',
                'Impedance Control & Matching',
                'EMC/EMI Considerations',
                'High-Speed Design Rules',
                'DFM & Design Review',
            ],
        },

        // === AUTOMOTIVE ===
        {
            name: 'CAN Protocol',
            topics: [
                'CAN Bus Basics & Topology',
                'Message Frame Format (Standard/Extended)',
                'Bit Timing & Baud Rate',
                'Message Filtering & Masking',
                'Error Detection Mechanisms',
                'Bus Arbitration & Priority',
                'CAN FD Extended Frames',
                'Network Management (NM)',
                'Transport Protocol (ISO-TP)',
                'CAN Security & SecOC',
            ],
        },
        {
            name: 'AUTOSAR',
            topics: [
                'Architecture Layers (BSW, RTE, SWC)',
                'Software Component Design',
                'Ports & Interfaces',
                'RTE Configuration',
                'Communication Stack (COM, PDU Router)',
                'Diagnostics (DCM, DEM)',
                'Memory Stack (NvM, Fee)',
                'OS Configuration & Tasks',
                'Mode Management',
                'Adaptive AUTOSAR & SOA',
            ],
        },
        {
            name: 'UDS Diagnostics',
            topics: [
                'Diagnostic Sessions & Services',
                'Read/Write Data by Identifier',
                'DTC Read & Clear Operations',
                'Security Access & Authentication',
                'Routine Control',
                'Input/Output Control',
                'ECU Programming (Flashing)',
                'Transport Layer (DoIP, CAN-TP)',
                'Tester Present & Session Handling',
                'OBD-II Compliance',
            ],
        },
        {
            name: 'ISO 26262',
            topics: [
                'Functional Safety Concepts',
                'ASIL Classification (A-D)',
                'Hazard Analysis & Risk Assessment',
                'Safety Goals & Requirements',
                'Hardware Metrics (SPFM, LFM)',
                'Software Development Process',
                'Verification & Validation',
                'Failure Mode Analysis (FMEA)',
                'Safety Case Documentation',
                'Proven-in-Use Arguments',
            ],
        },
        {
            name: 'CANoe/CANalyzer',
            topics: [
                'Tool Setup & Configuration',
                'DBC File Interpretation',
                'Message Monitoring & Trace',
                'Signal Graphs & Panels',
                'CAPL Script Basics',
                'Simulation Node Creation',
                'Diagnostic Scripting',
                'Network Simulation',
                'Test Module Automation',
                'Multi-Bus Configuration',
            ],
        },
        {
            name: 'LIN Protocol',
            topics: [
                'LIN Bus Architecture',
                'Master-Slave Communication',
                'Frame Types (Unconditional, Event, Sporadic)',
                'Schedule Table Management',
                'Signal Encoding & Decoding',
                'LIN Description File (LDF)',
                'Sleep & Wake-up Mechanisms',
                'Diagnostics over LIN',
                'LIN/CAN Gateway',
                'Conformance Testing',
            ],
        },
        {
            name: 'Automotive Ethernet',
            topics: [
                '100BASE-T1 Physical Layer',
                'Ethernet Frame Format',
                'TCP/IP Stack in ECU',
                'SOME/IP Service Discovery',
                'DoIP (Diagnostics over IP)',
                'AVB/TSN for Real-Time',
                'VLAN & QoS Configuration',
                'Network Management',
                'Cybersecurity (TLS, SecOC)',
                'Multi-ECU Ethernet Architecture',
            ],
        },
        {
            name: 'Vehicle Networking',
            topics: [
                'In-Vehicle Network Topology',
                'CAN/LIN/FlexRay Basics',
                'Gateway ECU Concepts',
                'Network Management (NM)',
                'Diagnostic Routing',
                'Signal-Based Communication',
                'Service-Oriented Architecture',
                'E/E Architecture Design',
                'Cybersecurity Architecture',
                'Zonal Architecture Concepts',
            ],
        },
        {
            name: 'HIL Testing',
            topics: [
                'HIL Simulation Concepts',
                'Plant Model Basics',
                'I/O Configuration & Calibration',
                'Test Case Design',
                'Fault Injection Testing',
                'Real-Time Execution',
                'Signal Conditioning',
                'Test Automation Scripts',
                'Coverage Analysis',
                'CI/CD Integration for HIL',
            ],
        },
        {
            name: 'Model-Based Development',
            topics: [
                'Simulink Basics & Block Diagrams',
                'State Machines (Stateflow)',
                'Data Types & Fixed-Point',
                'Model-in-the-Loop (MIL) Testing',
                'Code Generation (Embedded Coder)',
                'Software-in-the-Loop (SIL)',
                'Integration with AUTOSAR',
                'Model Guidelines & Standards',
                'Variant Management',
                'Model-Based Testing & Coverage',
            ],
        },

        // === ANDROID DEVELOPMENT ===
        {
            name: 'Android Kotlin',
            topics: [
                'Variables, Types & Null Safety',
                'Control Flow & Collections',
                'Functions & Lambdas',
                'Classes & Data Classes',
                'Coroutines Basics',
                'Extension Functions & Scope Functions',
                'Sealed Classes & Generics',
                'Flow & StateFlow',
                'Coroutines Advanced (Channels, Supervisors)',
                'Kotlin Multiplatform Basics',
            ],
        },
        {
            name: 'Android UI (Jetpack Compose)',
            topics: [
                'Composable Functions Basics',
                'Layout (Column, Row, Box)',
                'State Management & Remember',
                'Lists (LazyColumn, LazyGrid)',
                'Navigation Component',
                'Theming & Material Design 3',
                'Animations & Transitions',
                'Custom Layouts & Drawing',
                'Side Effects & Lifecycle',
                'Performance Optimization',
            ],
        },
        {
            name: 'Android Architecture',
            topics: [
                'Activity & Fragment Lifecycle',
                'ViewModel & LiveData',
                'Repository Pattern',
                'Dependency Injection (Hilt)',
                'Room Database',
                'WorkManager & Background Tasks',
                'Clean Architecture Layers',
                'Multi-Module Project Structure',
                'Testing (Unit, Integration, UI)',
                'App Performance & Profiling',
            ],
        },
        {
            name: 'Android Networking',
            topics: [
                'HTTP Basics & REST APIs',
                'Retrofit Setup & Configuration',
                'JSON Parsing (Moshi/Gson)',
                'Coroutines with Retrofit',
                'Error Handling & Retry',
                'Interceptors & Authentication',
                'Caching Strategies',
                'WebSocket Communication',
                'GraphQL with Apollo',
                'Network Security & Certificate Pinning',
            ],
        },
        {
            name: 'Android Automotive (AAOS)',
            topics: [
                'AAOS Architecture Overview',
                'Car API & CarService',
                'Vehicle HAL (VHAL)',
                'Cluster & HUD Development',
                'Media & Audio Management',
                'HVAC & Seat Controls',
                'Navigation Integration',
                'User Management & Multi-Display',
                'OTA Updates & System Apps',
                'Safety-Critical UI Guidelines',
            ],
        },
        {
            name: 'Flutter',
            topics: [
                'Dart Language Basics',
                'Widgets & Widget Tree',
                'State Management (setState, Provider)',
                'Navigation & Routing',
                'HTTP & API Integration',
                'Local Storage (SharedPrefs, Hive)',
                'Advanced State (Bloc/Riverpod)',
                'Platform Channels & Native Code',
                'Animations & Custom Painters',
                'Testing & CI/CD for Flutter',
            ],
        },

        // === COMMON TOOLS ===
        {
            name: 'Git',
            topics: [
                'Repository Init & Clone',
                'Add, Commit & Push',
                'Branching & Merging',
                'Conflict Resolution',
                'Rebasing & Cherry-Pick',
                'Stashing & Reflog',
                'Tagging & Releases',
                'Git Hooks & Automation',
                'Submodules & Subtrees',
                'Advanced Workflows (Gitflow, Trunk-Based)',
            ],
        },
        {
            name: 'Python',
            topics: [
                'Variables & Data Types',
                'Control Flow & Loops',
                'Functions & Modules',
                'File I/O & Exception Handling',
                'OOP (Classes, Inheritance)',
                'List Comprehensions & Generators',
                'Decorators & Context Managers',
                'Multithreading & Multiprocessing',
                'Testing (pytest, unittest)',
                'Packaging & Virtual Environments',
            ],
        },
        {
            name: 'JIRA & Agile',
            topics: [
                'Issue Types & Workflows',
                'Sprint Planning & Backlog',
                'User Stories & Acceptance Criteria',
                'Scrum Ceremonies',
                'Board Configuration',
                'Estimation & Velocity',
                'Release Management',
                'Advanced JQL Queries',
                'Automation Rules',
                'Portfolio & Roadmap Planning',
            ],
        },
        {
            name: 'Linux Administration',
            topics: [
                'File System & Navigation',
                'Users & Permissions',
                'Process Management',
                'Shell Scripting Basics',
                'Package Management',
                'Networking (ip, ss, iptables)',
                'Systemd & Service Management',
                'Disk & Storage Management',
                'Performance Monitoring & Tuning',
                'Kernel Configuration & Modules',
            ],
        },
    ];

    const skills = [];
    const skillMaxTopics = {
        'Embedded C': 10,
        'C++': 10,
        'FreeRTOS': 8,
        'I2C Protocol': 7,
        'SPI Protocol': 7,
        'ARM Cortex-M': 9,
        'UART/USART': 6,
        'PCB Design': 5,
        'CAN': 8,
        'AUTOSAR': 10,
        'UDS Diagnostics': 6,
        'ISO 26262': 5,
        'CANoe': 5,
        'LIN': 5,
        'Automotive Ethernet': 7,
        'Vehicle Networking': 6,
        'HIL Testing': 7,
        'Model-Based Development': 8,
        'Android Kotlin': 10,
        'Jetpack Compose': 6,
        'Android Architecture': 8,
        'Android Networking': 6,
        'Android Automotive': 5,
        'Flutter': 7,
        'Git': 6,
        'Python': 8,
        'JIRA & Agile': 5,
        'Linux Administration': 7,
    };

    for (const template of skillTemplates) {
        const maxTopics = skillMaxTopics[template.name] || 10;
        const skill = await prisma.skill.create({
            data: {
                name: template.name,
                created_by: admin.id,
                max_topics: maxTopics,
            },
        });
        skills.push(skill);

        for (const [idx, topicName] of template.topics.slice(0, maxTopics).entries()) {
            await prisma.skillTopic.create({
                data: {
                    skill_id: skill.id,
                    name: topicName,
                    sort_order: idx + 1,
                },
            });
        }
    }

    // 8. Distribute skills across all users with proficiency levels
    console.log('Distributing skills with proficiency levels...');
    const allUsers = [...deptHeads, ...managers, ...leads, ...employees];
    const proficiencyLevels = ['BEGINNER', 'MEDIUM', 'EXPERT', 'MASTER'];
    const proficiencyValues = { BEGINNER: 1, MEDIUM: 2, EXPERT: 3, MASTER: 4 };

    function calculateScore(selections) {
        if (!selections || selections.length === 0) return 0;
        const sum = selections.reduce((acc, sel) => acc + (proficiencyValues[sel] || 0), 0);
        const average = sum / selections.length;
        return Math.round(average * 10);
    }

    for (const user of allUsers) {
        const numSkills = Math.floor(Math.random() * 4) + 3;
        const shuffledSkills = [...skills].sort(() => Math.random() - 0.5);
        const userSkills = shuffledSkills.slice(0, numSkills);

        for (const skill of userSkills) {
            // Get skill details
            const skillData = await prisma.skill.findUnique({
                where: { id: skill.id },
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            });

            // Randomly select 40-80% of available topics
            const maxTopicsCount = skillData.max_topics || 10;
            const minTopics = Math.max(1, Math.ceil(maxTopicsCount * 0.4));
            const maxTopicsForThisSkill = Math.ceil(maxTopicsCount * 0.8);
            const topicCount = Math.floor(Math.random() * (maxTopicsForThisSkill - minTopics + 1)) + minTopics;

            // Randomly assign proficiency levels to selected topics
            const proficiencySelections = [];
            const selectedTopicIds = [];
            for (let i = 0; i < topicCount && i < skillData.topics.length; i++) {
                const randomLevel = proficiencyLevels[Math.floor(Math.random() * proficiencyLevels.length)];
                proficiencySelections.push(randomLevel);
                selectedTopicIds.push(skillData.topics[i].id);
            }

            // Calculate score from proficiency levels
            const calculatedLevel = calculateScore(proficiencySelections);
            const yearsExp = Math.floor(Math.random() * Math.min(user.years_of_experience || 1, 8)) + 1;
            const canTeach = calculatedLevel >= 25 && Math.random() > 0.5;

            // Create employee skill with calculated level
            const empSkill = await prisma.employeeSkill.create({
                data: {
                    user_id: user.id,
                    skill_id: skill.id,
                    current_level: topicCount,
                    calculated_level: calculatedLevel,
                    target_level: Math.min(100, calculatedLevel + Math.floor(Math.random() * 25) + 10),
                    years_experience: yearsExp,
                    can_teach: canTeach,
                    status: 'APPROVED',
                },
            });

            // Create proficiency selections for each topic
            for (let i = 0; i < selectedTopicIds.length; i++) {
                await prisma.employeeSkillTopicSelection.create({
                    data: {
                        employee_skill_id: empSkill.id,
                        skill_topic_id: selectedTopicIds[i],
                        proficiency_level: proficiencySelections[i],
                    },
                });
            }

            // Also keep legacy EmployeeSkillTopic for backward compatibility
            for (const topicId of selectedTopicIds) {
                await prisma.employeeSkillTopic.create({
                    data: {
                        employee_skill_id: empSkill.id,
                        skill_topic_id: topicId,
                    },
                });
            }
        }
    }

    console.log('\n✅ Seed data created successfully!\n');
    console.log('📊 Demo Organization Structure:');
    console.log('  • 1 Admin (MD)');
    console.log('  • 1 CTO');
    console.log('  • 4 Department Heads');
    console.log('  • 8 Managers');
    console.log('  • 16 Leads');
    console.log('  • 32 Employees');
    console.log(`  • ${skillTemplates.length} Skills with dynamic topics (5-10 per skill)\n`);
    console.log('🎯 Each employee has:\n  • 3-6 skills assigned\n  • Random proficiency levels per topic (BEGINNER, MEDIUM, EXPERT, MASTER)\n  • Calculated score: 0-40 based on proficiency levels\n  • All skills APPROVED for demo purposes\n');
    console.log('🔑 Login Credentials (all passwords: Demo123):');
    console.log('  Admin: admin@suprajit.com');
    console.log('  CTO: cto@suprajit.com');
    console.log('  Dept Head 1: depthead1@suprajit.com');
    console.log('  Manager 1: manager1@suprajit.com');
    console.log('  Lead 1: lead1@suprajit.com');
    console.log('  Employee 1: emp1@suprajit.com');
    console.log('\n💡 Pattern: role + number + @suprajit.com\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
