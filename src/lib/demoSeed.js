/**
 * Seed content for the built-in demo workspace.
 *
 * Everything here is local: audio and materials live in `public/demo/`, and
 * avatars are inline SVGs, so the demo works with no network at all.
 */

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const ago = (days) => ({ __localTimestamp: now - days * DAY })

const STUDENT_NAMES = [
  'Tunde Bakare',
  'Amara Nwosu',
  'Chidi Eze',
  'Halima Yusuf',
  'Segun Adeyemi',
  'Ngozi Obi',
  'Ibrahim Musa',
  'Blessing Ekpo',
  'Emeka Okafor',
  'Fatima Bello',
  'Kelvin Hart',
  'Zainab Aliyu',
  'Damilola Ajayi',
  'Grace Okonjo',
]

export const DEMO_ACCOUNTS = {
  instructor: {
    uid: 'demo-instructor',
    email: 'amara.okafor@voxcampus.edu',
    fullName: 'Dr. Amara Okafor',
    role: 'instructor',
    institution: 'Bolmor Polytechnic',
    level: 'Faculty',
    bio: 'Lecturer in Electronic Engineering. I record every lecture so my students can revise at their own pace.',
    avatarUrl: '',
    joinedCourses: [],
  },
  student: {
    uid: 'demo-student',
    email: 'tunde.bakare@voxcampus.edu',
    fullName: 'Tunde Bakare',
    role: 'student',
    institution: 'Bolmor Polytechnic',
    level: 'ND2',
    bio: 'Second year Electrical Engineering student. Big fan of live revision rooms.',
    avatarUrl: '',
    joinedCourses: ['demo-course-signals', 'demo-course-ml'],
  },
}

export function buildDemoSeed() {
  const users = {}
  STUDENT_NAMES.forEach((name, index) => {
    const id = `demo-stu-${index + 1}`
    users[id] = {
      uid: id,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@voxcampus.edu`,
      fullName: name,
      role: 'student',
      institution: 'Bolmor Polytechnic',
      level: index % 2 === 0 ? 'ND2' : 'HND1',
      bio: '',
      avatarUrl: '',
      joinedCourses:
        index % 3 === 0
          ? ['demo-course-signals']
          : index % 3 === 1
            ? ['demo-course-signals', 'demo-course-ml']
            : ['demo-course-thermo', 'demo-course-ml'],
    }
  })

  users['demo-instructor'] = { ...DEMO_ACCOUNTS.instructor }
  users['demo-student'] = { ...DEMO_ACCOUNTS.student }

  const courses = {
    'demo-course-signals': {
      title: 'Signals & Systems 301',
      description:
        'Fourier analysis, convolution, Laplace and Z-transforms with weekly problem sets pulled straight from past exam papers.',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      courseCode: 'PHY7X2',
      createdAt: ago(42),
    },
    'demo-course-ml': {
      title: 'Introduction to Machine Learning',
      description:
        'A practical tour of supervised and unsupervised learning. We build every model from scratch before reaching for a library.',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      courseCode: 'ML42KQ',
      createdAt: ago(21),
    },
    'demo-course-thermo': {
      title: 'Thermodynamics & Heat Transfer',
      description:
        'Laws of thermodynamics, entropy, cycles and real-world heat exchanger design for mechanical engineering students.',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      courseCode: 'THM9DP',
      createdAt: ago(14),
    },
  }

  const podcasts = {
    'demo-pod-1': {
      courseId: 'demo-course-signals',
      title: 'Lecture 01 — What is a signal?',
      description:
        'We open the course by defining continuous and discrete signals, then look at the energy and power of a waveform and why the difference matters for stability.',
      fileUrl: '/demo/lecture-01.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: true,
      likes: ['demo-stu-1', 'demo-stu-2', 'demo-stu-4', 'demo-stu-7'],
      playCount: 412,
      createdAt: ago(40),
    },
    'demo-pod-2': {
      courseId: 'demo-course-signals',
      title: 'Lecture 02 — Convolution, intuitively',
      description:
        'Convolution shows up everywhere in engineering. We build it from first principles with two short audio clips before touching the integral.',
      fileUrl: '/demo/lecture-02.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: true,
      likes: ['demo-stu-3', 'demo-stu-5', 'demo-stu-6'],
      playCount: 268,
      createdAt: ago(33),
    },
    'demo-pod-3': {
      courseId: 'demo-course-signals',
      title: 'Lecture 03 — The Fourier series',
      description:
        'Decomposing periodic signals into sinusoids. Includes a worked example on a square wave that most students get wrong in the exam.',
      fileUrl: '/demo/lecture-03.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: false,
      likes: ['demo-stu-1'],
      playCount: 96,
      createdAt: ago(26),
    },
    'demo-pod-4': {
      courseId: 'demo-course-ml',
      title: 'Week 1 — Learning from data',
      description:
        'What does it actually mean for a machine to learn? We frame supervised learning as function approximation and talk about overfitting on day one.',
      fileUrl: '/demo/lecture-04.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: true,
      likes: ['demo-stu-2', 'demo-stu-8', 'demo-stu-9', 'demo-stu-10', 'demo-stu-11', 'demo-stu-12'],
      playCount: 731,
      createdAt: ago(19),
    },
    'demo-pod-5': {
      courseId: 'demo-course-ml',
      title: 'Week 2 — Gradient descent by hand',
      description:
        'No frameworks. We differentiate a loss function, take a step, and watch the parameters move until convergence on a tiny dataset.',
      fileUrl: '/demo/lecture-01.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: true,
      likes: ['demo-stu-4', 'demo-stu-13'],
      playCount: 189,
      createdAt: ago(12),
    },
    'demo-pod-6': {
      courseId: 'demo-course-thermo',
      title: 'Module 1 — The zeroth and first laws',
      description:
        'Temperature, heat, internal energy and the conservation principle that underpins every engine you will ever analyse.',
      fileUrl: '/demo/lecture-02.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: true,
      likes: ['demo-stu-6', 'demo-stu-14'],
      playCount: 154,
      createdAt: ago(10),
    },
    'demo-pod-7': {
      courseId: 'demo-course-thermo',
      title: 'Module 2 — Entropy explained properly',
      description:
        'Entropy is not disorder. We use the statistical definition to rebuild intuition from the ground up, then connect it back to the second law.',
      fileUrl: '/demo/lecture-03.wav',
      fileExtension: 'wav',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      isPublic: true,
      likes: ['demo-stu-1', 'demo-stu-3', 'demo-stu-5', 'demo-stu-9'],
      playCount: 322,
      createdAt: ago(4),
    },
  }

  const materials = {
    'demo-mat-1': {
      courseId: 'demo-course-signals',
      title: 'Course outline & reading list',
      description: 'Everything we cover this semester, week by week.',
      fileUrl: '/demo/lecture-notes.txt',
      fileExtension: 'txt',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      createdAt: ago(41),
    },
    'demo-mat-2': {
      courseId: 'demo-course-signals',
      title: 'Transform pairs cheat sheet',
      description: 'One page summary of every Fourier and Laplace pair you need.',
      fileUrl: '/demo/lecture-notes.txt',
      fileExtension: 'txt',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      createdAt: ago(30),
    },
    'demo-mat-3': {
      courseId: 'demo-course-ml',
      title: 'Linear algebra refresher',
      description: 'Vectors, matrices and the notation used throughout the course.',
      fileUrl: '/demo/lecture-notes.txt',
      fileExtension: 'txt',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      createdAt: ago(18),
    },
    'demo-mat-4': {
      courseId: 'demo-course-thermo',
      title: 'Steam tables (extract)',
      description: 'Reference tables for the cycle analysis problem sets.',
      fileUrl: '/demo/lecture-notes.txt',
      fileExtension: 'txt',
      instructorId: 'demo-instructor',
      instructorName: 'Dr. Amara Okafor',
      createdAt: ago(9),
    },
  }

  const assignments = {
    'demo-asg-1': {
      courseId: 'demo-course-signals',
      title: 'Problem Set 2 — Convolution',
      description:
        'Work through questions 1 to 6 on the problem sheet. Show every step of the convolution integral; partial credit is generous but only for shown working.',
      dueDate: new Date(now - 3 * DAY).toISOString().slice(0, 16),
      instructorId: 'demo-instructor',
      createdAt: ago(12),
    },
    'demo-asg-2': {
      courseId: 'demo-course-signals',
      title: 'Lab report — Fourier decomposition',
      description:
        'Record a short audio clip, decompose it in Python, and submit a one page report plus your plotted spectrum.',
      dueDate: new Date(now + 6 * DAY).toISOString().slice(0, 16),
      instructorId: 'demo-instructor',
      createdAt: ago(5),
    },
    'demo-asg-3': {
      courseId: 'demo-course-ml',
      title: 'Build linear regression from scratch',
      description:
        'No scikit-learn. Implement ordinary least squares with NumPy and report your RMSE on the provided housing subset.',
      dueDate: new Date(now + 11 * DAY).toISOString().slice(0, 16),
      instructorId: 'demo-instructor',
      createdAt: ago(3),
    },
  }

  const submissions = {
    'demo-sub-1': {
      assignmentId: 'demo-asg-1',
      courseId: 'demo-course-signals',
      studentId: 'demo-stu-1',
      studentName: 'Tunde Bakare',
      textContent:
        'Attached my worked solutions. Question 4 took me a while — I think the trick is flipping the kernel before you slide it.',
      fileUrl: '',
      status: 'graded',
      score: 82,
      submittedAt: ago(4),
      createdAt: ago(4),
    },
    'demo-sub-2': {
      assignmentId: 'demo-asg-1',
      courseId: 'demo-course-signals',
      studentId: 'demo-stu-2',
      studentName: 'Amara Nwosu',
      textContent: 'Solutions for 1-5 attached. I could not finish question 6, sorry!',
      fileUrl: '/demo/lecture-notes.txt',
      status: 'graded',
      score: 64,
      submittedAt: ago(4),
      createdAt: ago(4),
    },
    'demo-sub-3': {
      assignmentId: 'demo-asg-1',
      courseId: 'demo-course-signals',
      studentId: 'demo-stu-4',
      studentName: 'Segun Adeyemi',
      textContent: 'Please find my submission below. Let me know if the handwriting scan is unclear.',
      fileUrl: '',
      status: 'pending',
      score: null,
      submittedAt: ago(2),
      createdAt: ago(2),
    },
    'demo-sub-4': {
      assignmentId: 'demo-asg-2',
      courseId: 'demo-course-signals',
      studentId: 'demo-stu-5',
      studentName: 'Ngozi Obi',
      textContent: 'Spectrum plot is attached. The fundamental sits at 220 Hz as expected.',
      fileUrl: '/demo/lecture-notes.txt',
      status: 'pending',
      score: null,
      submittedAt: ago(1),
      createdAt: ago(1),
    },
    'demo-sub-5': {
      assignmentId: 'demo-asg-3',
      courseId: 'demo-course-ml',
      studentId: 'demo-stu-8',
      studentName: 'Blessing Ekpo',
      textContent: 'RMSE came out at 4.31 after standardising the features. Code is in the attached notebook export.',
      fileUrl: '',
      status: 'declined',
      score: null,
      submittedAt: ago(1),
      createdAt: ago(1),
    },
  }

  const live_rooms = {
    'demo-room-1': {
      roomId: 'LR7KX9',
      courseId: 'demo-course-signals',
      topic: 'Exam revision — transforms Q&A',
      hostId: 'demo-instructor',
      hostName: 'Dr. Amara Okafor',
      status: 'active',
      createdAt: ago(0),
    },
  }

  return { users, courses, podcasts, materials, assignments, submissions, live_rooms }
}
