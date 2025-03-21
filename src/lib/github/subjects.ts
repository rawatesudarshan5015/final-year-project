import { SubjectMap } from './types';

// This is a simplified mapping. In a real application, this would be more comprehensive
// with proper subject codes and complete mappings for all patterns/years/branches/semesters
export const subjectMap: SubjectMap = {
  '2019': {
    'FE': {
      'IT': {
        '1': [
          { name: 'Engineering Mathematics I', code: 'FEC101' },
          { name: 'Engineering Physics I', code: 'FEC102' },
          { name: 'Engineering Chemistry I', code: 'FEC103' },
          { name: 'Engineering Mechanics', code: 'FEC104' },
          { name: 'Basic Electrical Engineering', code: 'FEC105' },
          { name: 'Engineering Drawing', code: 'FEC106' }
        ],
        '2': [
          { name: 'Engineering Mathematics II', code: 'FEC201' },
          { name: 'Engineering Physics II', code: 'FEC202' },
          { name: 'Engineering Chemistry II', code: 'FEC203' },
          { name: 'C Programming', code: 'FEC204' },
          { name: 'Professional Communication and Ethics', code: 'FEC205' },
          { name: 'Environmental Studies', code: 'FEC206' }
        ]
      },
      'CE': {
        '1': [
          { name: 'Engineering Mathematics I', code: 'FEC101' },
          { name: 'Engineering Physics I', code: 'FEC102' },
          { name: 'Engineering Chemistry I', code: 'FEC103' },
          { name: 'Engineering Mechanics', code: 'FEC104' },
          { name: 'Basic Electrical Engineering', code: 'FEC105' },
          { name: 'Engineering Drawing', code: 'FEC106' }
        ],
        '2': [
          { name: 'Engineering Mathematics II', code: 'FEC201' },
          { name: 'Engineering Physics II', code: 'FEC202' },
          { name: 'Engineering Chemistry II', code: 'FEC203' },
          { name: 'C Programming', code: 'FEC204' },
          { name: 'Professional Communication and Ethics', code: 'FEC205' },
          { name: 'Environmental Studies', code: 'FEC206' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Engineering Mathematics I', code: 'FEC101' },
          { name: 'Engineering Physics I', code: 'FEC102' },
          { name: 'Engineering Chemistry I', code: 'FEC103' },
          { name: 'Engineering Mechanics', code: 'FEC104' },
          { name: 'Basic Electrical Engineering', code: 'FEC105' },
          { name: 'Engineering Drawing', code: 'FEC106' }
        ],
        '2': [
          { name: 'Engineering Mathematics II', code: 'FEC201' },
          { name: 'Engineering Physics II', code: 'FEC202' },
          { name: 'Engineering Chemistry II', code: 'FEC203' },
          { name: 'C Programming', code: 'FEC204' },
          { name: 'Professional Communication and Ethics', code: 'FEC205' },
          { name: 'Environmental Studies', code: 'FEC206' }
        ]
      }
    },
    'SE': {
      'IT': {
        '1': [
          { name: 'Engineering Mathematics III', code: 'ITC301' },
          { name: 'Data Structures and Algorithms', code: 'ITC302' },
          { name: 'Database Management Systems', code: 'ITC303' },
          { name: 'Computer Organization and Architecture', code: 'ITC304' },
          { name: 'Discrete Mathematics', code: 'ITC305' }
        ],
        '2': [
          { name: 'Engineering Mathematics IV', code: 'ITC401' },
          { name: 'Computer Networks', code: 'ITC402' },
          { name: 'Operating Systems', code: 'ITC403' },
          { name: 'Microprocessor', code: 'ITC404' },
          { name: 'Web Programming', code: 'ITC405' }
        ]
      },
      'CE': {
        '1': [
          { name: 'Engineering Mathematics III', code: 'CSC301' },
          { name: 'Data Structures and Algorithms', code: 'CSC302' },
          { name: 'Database Management Systems', code: 'CSC303' },
          { name: 'Computer Organization and Architecture', code: 'CSC304' },
          { name: 'Discrete Mathematics', code: 'CSC305' }
        ],
        '2': [
          { name: 'Engineering Mathematics IV', code: 'CSC401' },
          { name: 'Computer Networks', code: 'CSC402' },
          { name: 'Operating Systems', code: 'CSC403' },
          { name: 'Microprocessor', code: 'CSC404' },
          { name: 'Web Programming', code: 'CSC405' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Engineering Mathematics III', code: 'EXC301' },
          { name: 'Digital Circuits and Systems', code: 'EXC302' },
          { name: 'Electronic Devices and Circuits', code: 'EXC303' },
          { name: 'Signals and Systems', code: 'EXC304' },
          { name: 'Network Theory', code: 'EXC305' }
        ],
        '2': [
          { name: 'Engineering Mathematics IV', code: 'EXC401' },
          { name: 'Microprocessors and Microcontrollers', code: 'EXC402' },
          { name: 'Analog Communication', code: 'EXC403' },
          { name: 'Control Systems', code: 'EXC404' },
          { name: 'Integrated Circuits', code: 'EXC405' }
        ]
      }
    },
    'TE': {
      'IT': {
        '1': [
          { name: 'Design and Analysis of Algorithms', code: 'ITC501' },
          { name: 'Human Computer Interaction', code: 'ITC502' },
          { name: 'Machine Learning', code: 'ITC503' },
          { name: 'Theory of Computation', code: 'ITC504' },
          { name: 'Operating Systems', code: 'ITC505' }
        ],
        '2': [
          { name: 'Artificial Intelligence', code: 'ITC601' },
          { name: 'Computer Networks and Security', code: 'ITC602' },
          { name: 'Data Science and Big Data Analytics', code: 'ITC603' },
          { name: 'Web Application Development', code: 'ITC604' }
        ]
      },
      'CE': {
        '1': [
          { name: 'Theory of Computation', code: 'CSC501' },
          { name: 'Software Engineering', code: 'CSC502' },
          { name: 'Computer Networks', code: 'CSC503' },
          { name: 'Data Warehousing and Mining', code: 'CSC504' },
          { name: 'Internet Programming', code: 'CSC505' }
        ],
        '2': [
          { name: 'System Programming and Compiler Construction', code: 'CSC601' },
          { name: 'Mobile Communication and Computing', code: 'CSC602' },
          { name: 'Artificial Intelligence', code: 'CSC603' },
          { name: 'Data Science and Big Data Analytics', code: 'CSC604' },
          { name: 'Cloud Computing', code: 'CSC605' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Digital Communication', code: 'EXC501' },
          { name: 'Microcontrollers and Applications', code: 'EXC502' },
          { name: 'Digital Signal Processing', code: 'EXC503' },
          { name: 'VLSI Design', code: 'EXC504' },
          { name: 'Computer Organization', code: 'EXC505' }
        ],
        '2': [
          { name: 'Antenna and Wave Propagation', code: 'EXC601' },
          { name: 'Embedded Systems', code: 'EXC602' },
          { name: 'Mobile Communication', code: 'EXC603' },
          { name: 'Advanced Digital Signal Processing', code: 'EXC604' },
          { name: 'Wireless Sensor Networks', code: 'EXC605' }
        ]
      }
    },
    'BE': {
      'IT': {
        '1': [
          { name: 'Deep Learning', code: 'ITC701' },
          { name: 'Information Storage and Retrieval', code: 'ITC702' },
          { name: 'Multimedia Technology', code: 'ITC703' },
          { name: 'Software Project Management', code: 'ITC704' },
          { name: 'Wireless Communication', code: 'ITC705' }
        ],
        '2': [
          { name: 'Blockchain Technology', code: 'ITC801' },
          { name: 'Distributed Systems', code: 'ITC802' },
          { name: 'Social Computing', code: 'ITC803' }
        ]
      },
      'CE': {
        '1': [
          { name: 'Machine Learning', code: 'CSC701' },
          { name: 'Information and Network Security', code: 'CSC702' },
          { name: 'Internet of Things', code: 'CSC703' },
          { name: 'Infrastructure Security', code: 'CSC704' },
          { name: 'Wireless Networks', code: 'CSC705' }
        ],
        '2': [
          { name: 'Cyber Security and Forensics', code: 'CSC801' },
          { name: 'Distributed Computing', code: 'CSC802' },
          { name: 'Human-Computer Interaction', code: 'CSC803' },
          { name: 'Natural Language Processing', code: 'CSC804' },
          { name: 'Blockchain Technology', code: 'CSC805' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Optical Communication', code: 'EXC701' },
          { name: 'Robotics', code: 'EXC702' },
          { name: 'Satellite Communication', code: 'EXC703' },
          { name: 'Advanced Computer Architecture', code: 'EXC704' },
          { name: 'IoT and Embedded Systems', code: 'EXC705' }
        ],
        '2': [
          { name: 'Wireless Communication Systems', code: 'EXC801' },
          { name: 'CMOS VLSI Design', code: 'EXC802' },
          { name: 'Image Processing', code: 'EXC803' },
          { name: 'Machine Learning Applications', code: 'EXC804' },
          { name: 'Advanced Digital System Design', code: 'EXC805' }
        ]
      }
    }
  },
  // Add more patterns as needed (2015, 2024)
  '2015': {
    // Similar structure as '2019' 
    'FE': {
      'IT': {
        '1': [
          { name: 'Applied Mathematics I', code: 'FE101' },
          { name: 'Applied Physics I', code: 'FE102' },
          { name: 'Applied Chemistry I', code: 'FE103' },
          { name: 'Engineering Mechanics', code: 'FE104' },
          { name: 'Basics of Computer Engineering', code: 'FE105' }
        ],
        '2': [
          { name: 'Applied Mathematics II', code: 'FE201' },
          { name: 'Applied Physics II', code: 'FE202' },
          { name: 'Applied Chemistry II', code: 'FE203' },
          { name: 'C Programming', code: 'FE204' },
          { name: 'Engineering Drawing', code: 'FE205' }
        ]
      },
      // Similar for CE and ENTC
      'CE': {
        '1': [
          { name: 'Applied Mathematics I', code: 'FE101' },
          { name: 'Applied Physics I', code: 'FE102' },
          { name: 'Applied Chemistry I', code: 'FE103' },
          { name: 'Engineering Mechanics', code: 'FE104' },
          { name: 'Basics of Computer Engineering', code: 'FE105' }
        ],
        '2': [
          { name: 'Applied Mathematics II', code: 'FE201' },
          { name: 'Applied Physics II', code: 'FE202' },
          { name: 'Applied Chemistry II', code: 'FE203' },
          { name: 'C Programming', code: 'FE204' },
          { name: 'Engineering Drawing', code: 'FE205' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Applied Mathematics I', code: 'FE101' },
          { name: 'Applied Physics I', code: 'FE102' },
          { name: 'Applied Chemistry I', code: 'FE103' },
          { name: 'Engineering Mechanics', code: 'FE104' },
          { name: 'Basics of Electronics Engineering', code: 'FE105' }
        ],
        '2': [
          { name: 'Applied Mathematics II', code: 'FE201' },
          { name: 'Applied Physics II', code: 'FE202' },
          { name: 'Applied Chemistry II', code: 'FE203' },
          { name: 'Basic Electrical Engineering', code: 'FE204' },
          { name: 'Engineering Drawing', code: 'FE205' }
        ]
      }
    },
    'SE': {
      'IT': {
        '1': [
          { name: 'Data Structures', code: 'SE101' },
          { name: 'Database Management Systems', code: 'SE102' },
          { name: 'Object Oriented Programming', code: 'SE103' },
          { name: 'Digital Logic Design', code: 'SE104' },
          { name: 'Discrete Mathematics', code: 'SE105' }
        ],
        '2': [
          { name: 'Operating Systems', code: 'SE201' },
          { name: 'Computer Networks', code: 'SE202' },
          { name: 'Microprocessors', code: 'SE203' },
          { name: 'Web Development', code: 'SE204' },
          { name: 'Software Engineering', code: 'SE205' }
        ]
      },
      'CE': {
        '1': [
          { name: 'Data Structures', code: 'SE101' },
          { name: 'Database Management Systems', code: 'SE102' },
          { name: 'Object Oriented Programming', code: 'SE103' },
          { name: 'Digital Logic Design', code: 'SE104' },
          { name: 'Discrete Mathematics', code: 'SE105' }
        ],
        '2': [
          { name: 'Operating Systems', code: 'SE201' },
          { name: 'Computer Networks', code: 'SE202' },
          { name: 'Microprocessors', code: 'SE203' },
          { name: 'Web Development', code: 'SE204' },
          { name: 'Software Engineering', code: 'SE205' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Signals and Systems', code: 'SE101E' },
          { name: 'Digital Electronics', code: 'SE102E' },
          { name: 'Network Theory', code: 'SE103E' },
          { name: 'Electronic Devices', code: 'SE104E' },
          { name: 'Engineering Mathematics III', code: 'SE105E' }
        ],
        '2': [
          { name: 'Control Systems', code: 'SE201E' },
          { name: 'Analog Circuits', code: 'SE202E' },
          { name: 'Microprocessors', code: 'SE203E' },
          { name: 'Communication Systems', code: 'SE204E' },
          { name: 'Engineering Mathematics IV', code: 'SE205E' }
        ]
      }
    }
  },
  '2024': {
    // More modern curriculum
    'FE': {
      'IT': {
        '1': [
          { name: 'Calculus and Linear Algebra', code: 'FE2401' },
          { name: 'Modern Physics and Optics', code: 'FE2402' },
          { name: 'Material Science and Chemistry', code: 'FE2403' },
          { name: 'Introduction to Programming', code: 'FE2404' },
          { name: 'Digital Literacy and Cyber Ethics', code: 'FE2405' }
        ],
        '2': [
          { name: 'Differential Equations and Transforms', code: 'FE2406' },
          { name: 'Environmental Science and Sustainability', code: 'FE2407' },
          { name: 'Data Structures', code: 'FE2408' },
          { name: 'Computer Organization', code: 'FE2409' },
          { name: 'Professional Communication Skills', code: 'FE2410' }
        ]
      },
      'CE': {
        '1': [
          { name: 'Calculus and Linear Algebra', code: 'FE2401' },
          { name: 'Modern Physics and Optics', code: 'FE2402' },
          { name: 'Material Science and Chemistry', code: 'FE2403' },
          { name: 'Introduction to Programming', code: 'FE2404' },
          { name: 'Digital Literacy and Cyber Ethics', code: 'FE2405' }
        ],
        '2': [
          { name: 'Differential Equations and Transforms', code: 'FE2406' },
          { name: 'Environmental Science and Sustainability', code: 'FE2407' },
          { name: 'Data Structures', code: 'FE2408' },
          { name: 'Computer Organization', code: 'FE2409' },
          { name: 'Professional Communication Skills', code: 'FE2410' }
        ]
      },
      'ENTC': {
        '1': [
          { name: 'Calculus and Linear Algebra', code: 'FE2401' },
          { name: 'Modern Physics and Optics', code: 'FE2402' },
          { name: 'Material Science and Chemistry', code: 'FE2403' },
          { name: 'Introduction to Electrical Circuits', code: 'FE2404E' },
          { name: 'Digital Literacy and Cyber Ethics', code: 'FE2405' }
        ],
        '2': [
          { name: 'Differential Equations and Transforms', code: 'FE2406' },
          { name: 'Environmental Science and Sustainability', code: 'FE2407' },
          { name: 'Electronic Devices and Circuits', code: 'FE2408E' },
          { name: 'Digital System Design', code: 'FE2409E' },
          { name: 'Professional Communication Skills', code: 'FE2410' }
        ]
      }
    }
    // Continue with SE, TE, BE for 2024 pattern
  }
};

// Utility function to get subjects for specific criteria
export const getSubjects = (
  pattern: string,
  year: string,
  branch: string,
  semester: string
) => {
  try {
    return subjectMap[pattern]?.[year]?.[branch]?.[semester] || [];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}; 