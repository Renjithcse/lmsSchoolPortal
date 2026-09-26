const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const StudentPerformance = require('../../models/OnlineExam/StudentPerformance');
const Publish = require('../../models/OnlineExam/Publish');
const QuestionBank = require('../../models/OnlineExam/QuestionBank');
const Question = require('../../models/OnlineExam/Question');
const StudentExamAttempt = require('../../models/OnlineExam/StudentExamAttempt');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models//users/AcademicStudent');

exports.studentOnLineExamSummary = catchAsync(async (req, res, next) => {
    // Get studentId from token (populated by auth middleware)
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Get academicYearId and gradeId from query params or extract from current academic info
    let { academicYearId, gradeId } = req.query;
    
    // If not provided in query, get from current academic info
    if (!academicYearId || !gradeId) {
        const currentAcademic = await AcademicStudent.findOne({ 
            studentId: studentId,
            status: 'active'
        }).populate('academicYear grade');
        
        if (currentAcademic) {
            academicYearId = academicYearId || currentAcademic.academicYear?._id;
            gradeId = gradeId || currentAcademic.grade?._id;
        }
    }

    if (!academicYearId || !gradeId) {
        return next(new AppError('Academic year and grade information required', 400));
    }

    const performances = await StudentPerformance.find({ studentId })
        .populate({
            path: 'examId',
            match: { academicYear: academicYearId, grade: gradeId },
            populate: {
                path: 'subjectId',
                select: 'subjectName'
            }
        });

    const filteredPerformances = performances.filter(p => p.examId);

    // Group by subjectId
    const grouped = filteredPerformances.reduce((acc, perf) => {
        const subject = perf.examId.subjectId;
        if (!subject) return acc; // skip if subjectId is missing

        const subjectKey = subject._id.toString();
        if (!acc[subjectKey]) {
            acc[subjectKey] = {
                subjectId: subject._id,
                subjectName: subject.subjectName,
                performances: []
            };
        }
        acc[subjectKey].performances.push(perf);
        return acc;
    }, {});

    res.status(200).json({
        status: 'success',
        data: Object.values(grouped)
    });
});

exports.getStudentExamSummary = async (req, res, next) => {
    // Get studentId from token (populated by auth middleware)
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Get academicYearId and gradeId from query params or extract from current academic info
    let { academicYearId, gradeId } = req.query;
    
    // If not provided in query, get from current academic info
    if (!academicYearId || !gradeId) {
        const currentAcademic = await AcademicStudent.findOne({ 
            studentId: studentId,
            status: 'active'
        }).populate('academicYear grade');
        
        if (currentAcademic) {
            academicYearId = academicYearId || currentAcademic.academicYear?._id;
            gradeId = gradeId || currentAcademic.grade?._id;
        }
    }

    if (!academicYearId || !gradeId) {
        return next(new AppError('Academic year and grade information required', 400));
    }

    // 1. Find all StudentExamAttempt entries for this student
    const studentAttempts = await StudentExamAttempt.find({ studentId });
    
    if (studentAttempts.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: []
        });
    }

    // 2. Get publishIds from student attempts
    const publishIds = studentAttempts.map(attempt => attempt.publishId);

    // 3. Find publishes that match the student's attempts
    const publishes = await Publish.find({
        _id: { $in: publishIds },
        ...(gradeId && { grade: gradeId })
    })
        .populate({
            path: 'exam',
            match: academicYearId ? { academicYear: academicYearId } : {},
            populate: { path: 'subjectId', select: 'subjectName' }
        });

    // 4. Create attempt map for quick lookup
    const attemptMap = {};
    studentAttempts.forEach(attempt => {
        attemptMap[attempt.publishId.toString()] = attempt;
    });

    const grouped = {};

    publishes.forEach(pub => {
        if (!pub.exam || !pub.exam.subjectId) return;
        const subject = pub.exam.subjectId;
        const subjectKey = subject._id.toString();
        if (!grouped[subjectKey]) {
            grouped[subjectKey] = {
                subjectId: subject._id,
                subjectName: subject.subjectName,
                new: 0,
                pending: 0,
                completed: 0,
                expired: 0
            };
        }
        const pubId = pub._id.toString();
        const studentAttempt = attemptMap[pubId];
        
        // Only count exams that the student has attempted
        if (studentAttempt) {
            if (studentAttempt.attendedStatus === true) {
                grouped[subjectKey].completed++;
            } else {
                grouped[subjectKey].pending++;
            }
        }
    });

    res.status(200).json({
        status: 'success',
        data: Object.values(grouped)
    });
};

exports.getStudentSubjectExamStatus = async (req, res, next) => {
    const { subjectId } = req.params;

    // Get studentId from token (populated by auth middleware)
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Get academicYearId and gradeId from query params or extract from current academic info
    let { academicYearId, gradeId } = req.query;
    
    // If not provided in query, get from current academic info
    if (!academicYearId || !gradeId) {
        const currentAcademic = await AcademicStudent.findOne({ 
            studentId: studentId,
            status: 'active'
        }).populate('academicYear grade');
        
        if (currentAcademic) {
            academicYearId = academicYearId || currentAcademic.academicYear?._id;
            gradeId = gradeId || currentAcademic.grade?._id;
        }
    }

    if (!academicYearId || !gradeId) {
        return next(new AppError('Academic year and grade information required', 400));
    }

    // 1. Find all StudentExamAttempt entries for this student
    const studentAttempts = await StudentExamAttempt.find({ studentId });
    
    if (studentAttempts.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: {
                pending: [],
                completed: [],
                expired: []
            }
        });
    }

    // 2. Get publishIds from student attempts
    const publishIds = studentAttempts.map(attempt => attempt.publishId);

    // 3. Find publishes that match the student's attempts and subject criteria
    const publishes = await Publish.find({
        _id: { $in: publishIds },
        ...(gradeId && { grade: gradeId })
    })
        .populate({
            path: 'exam',
            match: {
                ...(academicYearId && { academicYear: academicYearId }),
                ...(subjectId && { subjectId: subjectId })
            }
        });

    // 4. Filter out publishes with no exam (due to populate match)
    const filteredPublishes = publishes.filter(pub => pub.exam);

    // 5. Create attempt map for quick lookup
    const attemptMap = {};
    studentAttempts.forEach(attempt => {
        attemptMap[attempt.publishId.toString()] = attempt;
    });

    console.log({studentAttempts: studentAttempts.length, filteredPublishes: filteredPublishes.length})

    // 6. Group by status based on StudentExamAttempt
    const result = {
        pending: [],
        completed: [],
        expired: []
    };

    filteredPublishes.forEach(pub => {
        const pubId = pub._id.toString();
        const studentAttempt = attemptMap[pubId];
        
        if (studentAttempt) {
            if (studentAttempt.attendedStatus === true) {
                // Student has completed this exam
                result.completed.push({
                    ...pub.toObject(),
                    studentAttempt: {
                        _id: studentAttempt._id,
                        attendedStatus: studentAttempt.attendedStatus,
                        attendedDate: studentAttempt.attendedDate,
                        securedMark: studentAttempt.securedMark,
                        totalQuestions: studentAttempt.totalQuestions
                    }
                });
            } else {
                // Student has started but not completed
                result.pending.push({
                    ...pub.toObject(),
                    studentAttempt: {
                        _id: studentAttempt._id,
                        attendedStatus: studentAttempt.attendedStatus,
                        attendedDate: studentAttempt.attendedDate,
                        securedMark: studentAttempt.securedMark,
                        totalQuestions: studentAttempt.totalQuestions
                    }
                });
            }
        }
    });

    res.status(200).json({
        status: 'success',
        data: result
    });
};

// Get single exam details including question bank and questions (without correct answer)
exports.getSingleExamDetails = async (req, res, next) => {
    const { publishId } = req.params;

    // 1. Find the publish (exam) and populate questionBank
    const publish = await Publish.findById(publishId)
        .populate({
            path: 'questionBank',
            model: 'QuestionBank'
        })
        .populate({
            path: 'exam',
            model: 'OnlineExam'
        });
    if (!publish) {
        return res.status(404).json({ status: 'fail', message: 'Exam not found' });
    }

    // Get questionBank ID - use populated _id if available, otherwise use the ObjectId directly
    const questionBankId = publish.questionBank?._id || publish.questionBank;
    
    if (!questionBankId) {
        return res.status(404).json({ status: 'fail', message: 'Question bank not found for this exam' });
    }

    // 2. Find all questions for this question bank, exclude correctAnswer
    const allQuestions = await Question.find({ questionBank: questionBankId })
        .select('-correctAnswer');

    // 3. Get the number of questions to select from publish
    const numberOfQuestions = publish.numberOfQuestions || allQuestions.length;
    
    console.log('Debug - Publish numberOfQuestions:', publish.numberOfQuestions);
    console.log('Debug - Available questions in bank:', allQuestions.length);
    console.log('Debug - Questions to select:', numberOfQuestions);

    // 4. Randomly select and shuffle questions
    let selectedQuestions = [];
    
    if (allQuestions.length > 0) {
        // Create a copy of all questions to avoid mutating the original array
        const questionsCopy = [...allQuestions];
        
        // Determine how many questions to actually select
        const questionsToSelect = Math.min(numberOfQuestions, questionsCopy.length);
        
        console.log('Debug - Questions to actually select:', questionsToSelect);
        
        // Randomly select the required number of questions
        for (let i = 0; i < questionsToSelect; i++) {
            const randomIndex = Math.floor(Math.random() * questionsCopy.length);
            selectedQuestions.push(questionsCopy[randomIndex]);
            questionsCopy.splice(randomIndex, 1); // Remove selected question to avoid duplicates
        }
        
        // Shuffle the selected questions
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
        
        console.log('Debug - Final selected questions count:', selectedQuestions.length);
    }

    // Check if we got fewer questions than requested
    const warning = allQuestions.length < publish.numberOfQuestions 
        ? `Warning: Only ${allQuestions.length} questions available in the question bank, but ${publish.numberOfQuestions} were requested.`
        : null;

    res.status(200).json({
        status: 'success',
        data: {
            publish,
            questionBank: publish.questionBank,
            questions: selectedQuestions,
            totalQuestionsInBank: allQuestions.length,
            selectedQuestionsCount: selectedQuestions.length,
            requestedQuestions: publish.numberOfQuestions,
            warning
        }
    });
};

// Get all attended exam details for a student by examId and studentId
exports.getStudentAttendedExamDetails = async (req, res, next) => {
    const { publishId } = req.query;

    // Get studentId from token (populated by auth middleware)
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // If publishId is provided, get details for that specific publish
    if (publishId) {
        const publish = await Publish.findById(publishId);
        if (!publish) {
            return res.status(404).json({ status: 'fail', message: 'Publish not found' });
        }

        const examId = publish.exam;

        // 1. Find the student's performance for this exam
        const performance = await StudentPerformance.findOne({ examId, studentId });
        if (!performance) {
            return res.status(404).json({ status: 'fail', message: 'No performance found for this student and exam' });
        }

        // 2. For each publishId in totalMarksArray, get publish details and marks
        const publishIds = performance.totalMarksArray.map(m => m.publishId);
        const publishes = await Publish.find({ _id: { $in: publishIds } })
            .populate('questionBank')
            .populate('exam');

        // 3. For each publish, get only the questions that the student attended
        const attendedDetails = [];
        for (const pub of publishes) {
            const markObj = performance.totalMarksArray.find(m => m.publishId.toString() === pub._id.toString());
            
            // Get student's attempt for this specific publish
            const studentAttempt = await StudentExamAttempt.findOne({ 
                studentId, 
                publishId: pub._id,
                attendedStatus: true 
            });
            
            if (!studentAttempt) {
                console.log(`No attended attempt found for student ${studentId} and publish ${pub._id}`);
                continue; // Skip this publish if no attended attempt found
            }
            
            // Get the question IDs that the student actually answered
            const attendedQuestionIds = [];
            if (Array.isArray(studentAttempt.studentAnswers)) {
                studentAttempt.studentAnswers.forEach(ans => {
                    if (ans.questionId) {
                        attendedQuestionIds.push(ans.questionId.toString());
                    }
                });
            }
            
            console.log(`Student attended ${attendedQuestionIds.length} questions for publish ${pub._id}`);
            
            // Get only the questions that the student attended
            const attendedQuestions = await Question.find({ 
                _id: { $in: attendedQuestionIds },
                questionBank: pub.questionBank._id 
            });
            
            // Create answer map for the attended questions
            const answerMap = {};
            if (Array.isArray(studentAttempt.studentAnswers)) {
                studentAttempt.studentAnswers.forEach(ans => {
                    if (ans.questionId) {
                        answerMap[ans.questionId.toString()] = ans.studentAnswer;
                    }
                });
            }
            
            // Build question details with correct and attended answer (only for attended questions)
            const questionDetails = attendedQuestions.map(q => ({
                _id: q._id,
                questionText: q.questionText,
                questionType: q.questionType,
                questionImage: q.questionImage,
                options: q.options,
                correctAnswer: q.correctAnswer,
                attendedAnswer: answerMap[q._id.toString()] || null,
                marks: q.marks
            }));

            attendedDetails.push({
                publish: pub,
                publishId: pub._id,
                marks: markObj ? markObj.marks : null,
                questions: questionDetails,
                totalAttendedQuestions: attendedQuestions.length,
                totalQuestionsInExam: pub.numberOfQuestions
            });
        }

        return res.status(200).json({
            status: 'success',
            data: attendedDetails
        });
    }

    // If no publishId provided, get all attended exams for the student
    try {
        // 1. Find all StudentExamAttempt entries for this student where attendedStatus is true
        const studentAttempts = await StudentExamAttempt.find({ 
            studentId, 
            attendedStatus: true 
        }).populate({
            path: 'publishId',
            populate: [
                {
                    path: 'exam',
                    populate: {
                        path: 'subjectId',
                        select: 'subjectName'
                    }
                }
            ]
        });

        if (studentAttempts.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: []
            });
        }

        // 2. Get all unique publishIds from attempts
        const publishIds = [...new Set(studentAttempts.map(attempt => attempt.publishId._id.toString()))];
        
        // 3. Get publish details with questions for each attended exam
        const attendedDetails = [];
        for (const attempt of studentAttempts) {
            const pub = attempt.publishId;
            if (!pub || !pub.exam) continue;

            // Get the question IDs that the student actually answered
            const attendedQuestionIds = [];
            if (Array.isArray(attempt.studentAnswers)) {
                attempt.studentAnswers.forEach(ans => {
                    if (ans.questionId) {
                        attendedQuestionIds.push(ans.questionId.toString());
                    }
                });
            }

            // Get only the questions that the student attended
            const attendedQuestions = await Question.find({ 
                _id: { $in: attendedQuestionIds },
                questionBank: pub.questionBank 
            });

            // Create answer map for the attended questions
            const answerMap = {};
            if (Array.isArray(attempt.studentAnswers)) {
                attempt.studentAnswers.forEach(ans => {
                    if (ans.questionId) {
                        answerMap[ans.questionId.toString()] = ans.studentAnswer;
                    }
                });
            }

            // Build question details with correct and attended answer
            const questionDetails = attendedQuestions.map(q => ({
                _id: q._id,
                questionText: q.questionText,
                questionType: q.questionType,
                questionImage: q.questionImage,
                options: q.options,
                correctAnswer: q.correctAnswer,
                attendedAnswer: answerMap[q._id.toString()] || null,
                marks: q.marks
            }));

            // Calculate total possible marks from questions
            const totalMarks = attendedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
            
            // Recalculate secured marks from questions to ensure accuracy
            let securedMarks = 0;
            questionDetails.forEach(q => {
                const attendedAnswer = q.attendedAnswer;
                if (!attendedAnswer || !q.options) return;
                
                // Find the index of the attended option
                const optionIndex = q.options.findIndex(option => option._id === attendedAnswer);
                if (optionIndex === -1) return;
                
                // Convert index to letter (A, B, C, D...)
                const attendedLetter = String.fromCharCode(65 + optionIndex);
                
                // Check if answer is correct
                if (attendedLetter === q.correctAnswer) {
                    securedMarks += q.marks || 0;
                }
            });
            
            const percentage = totalMarks > 0 ? (securedMarks / totalMarks) * 100 : 0;

            attendedDetails.push({
                _id: attempt._id,
                publishId: pub._id,
                publish: pub,
                score: securedMarks,
                totalQuestions: attempt.totalQuestions || 0,
                totalMarks: totalMarks,
                percentage: percentage,
                attemptedDate: attempt.attendedDate,
                questions: questionDetails,
                totalAttendedQuestions: attendedQuestions.length,
                totalQuestionsInExam: pub.numberOfQuestions
            });
        }

        return res.status(200).json({
            status: 'success',
            data: attendedDetails
        });

    } catch (error) {
        console.error('Error fetching all attended exams:', error);
        return res.status(500).json({
            status: 'fail',
            message: 'Failed to fetch attended exam details'
        });
    }
};

// Submit student answers for a specific publishId
exports.submitStudentExamAnswers = async (req, res, next) => {
    const { publishId, answers } = req.body; // answers: [{ questionId, studentAnswer }]
    if (!publishId || !Array.isArray(answers)) {
        return res.status(400).json({ status: 'fail', message: 'publishId and answers are required' });
    }

    // Get studentId from token (populated by auth middleware)
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // 1. Get publish, examId, and questionBank
    const publish = await Publish.findById(publishId);
    if (!publish) {
        return res.status(404).json({ status: 'fail', message: 'Publish not found' });
    }
    const examId = publish.exam;
    const questionBankId = publish.questionBank;

    // 2. Get all questions for this question bank
    const questions = await Question.find({ questionBank: questionBankId });
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    // 3. Calculate securedMark
    let securedMark = 0;
    console.log('Calculating securedMark for answers:', answers.length);
    console.log('Questions available:', Object.keys(questionMap).length);
    
    answers.forEach(ans => {
        const q = questionMap[ans.questionId];
        console.log('Question ID:', ans.questionId, 'Student Answer:', ans.studentAnswer);
        console.log('Question found:', !!q, 'Correct Answer:', q?.correctAnswer, 'Marks:', q?.marks);
        
        // Convert student answer to option letter (A, B, C, D) if it's a full option value
        let studentAnswerLetter = ans.studentAnswer;
        
        // If student answer is a full option value, find its index and convert to letter
        if (q && q.options && Array.isArray(q.options)) {
            const optionIndex = q.options.findIndex(option => {
                if (typeof option === 'string') {
                    return option === ans.studentAnswer;
                } else if (typeof option === 'object' && option !== null) {
                    return option._id === ans.studentAnswer || 
                           option.value === ans.studentAnswer || 
                           option.text === ans.studentAnswer;
                }
                return String(option) === ans.studentAnswer;
            });
            
            if (optionIndex !== -1) {
                studentAnswerLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D...
                console.log('Converted student answer from', ans.studentAnswer, 'to letter:', studentAnswerLetter);
            }
        }
        
        if (q && q.correctAnswer === studentAnswerLetter) {
            securedMark += q.marks;
            console.log('Correct answer! Added', q.marks, 'marks. Total:', securedMark);
        } else {
            console.log('Incorrect answer or question not found. Expected:', q?.correctAnswer, 'Got:', studentAnswerLetter);
        }
    });
    
    console.log('Final securedMark:', securedMark);

    // 4. Check if student has already attended this exam
    const existingAttempt = await StudentExamAttempt.findOne({ studentId, publishId });
    if (existingAttempt && existingAttempt.attendedStatus === true) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'Exam already attended. You cannot submit answers again.' 
        });
    }

    // 5. Create or update StudentExamAttempt
    let attempt;
    
    if (existingAttempt && existingAttempt.attendedStatus === false) {
        // Update existing attempt
        attempt = await StudentExamAttempt.findByIdAndUpdate(
            existingAttempt._id,
            {
                totalQuestions: questions.length,
                attendedStatus: true,
                attendedDate: new Date(),
                securedMark,
                studentAnswers: answers.map(a => ({ questionId: a.questionId, studentAnswer: a.studentAnswer }))
            },
            { new: true }
        );
        console.log('Updated existing attempt:', attempt._id);
    } else {
        // Create new attempt
        const attemptData = {
            studentId,
            publishId,
            totalQuestions: questions.length,
            attendedStatus: true,
            attendedDate: new Date(),
            securedMark,
            studentAnswers: answers.map(a => ({ questionId: a.questionId, studentAnswer: a.studentAnswer }))
        };

        attempt = new StudentExamAttempt(attemptData);
        await attempt.save();
        console.log('Created new attempt:', attempt._id);
    }

    // 6. Update StudentPerformance - One entry per student per exam
    let performance = null;
    let shouldIncrementAttendedUsers = false;
    
    try {
        // Try to find existing performance
        performance = await StudentPerformance.findOne({ studentId, examId });
        
        if (!performance) {
            // This is the first time the student is attempting this exam
            shouldIncrementAttendedUsers = true;
            
            // Create new performance record
            performance = new StudentPerformance({
                studentId,
                examId,
                bestMarkSecured: securedMark,
                attempts: 1,
                totalMarksArray: [{ publishId, marks: securedMark }]
            });
            await performance.save();
            console.log('Created new StudentPerformance:', performance._id, 'with marks:', securedMark);
        } else {
            // Update existing performance record
            console.log('Found existing performance:', performance._id);
            console.log('Current bestMarkSecured:', performance.bestMarkSecured);
            console.log('Current attempts:', performance.attempts);
            console.log('Current totalMarksArray:', performance.totalMarksArray);
            
            const markObj = performance.totalMarksArray.find(m => m.publishId.toString() === publishId.toString());
            
            if (markObj) {
                // Update existing publish marks
                markObj.marks = securedMark;
                console.log('Updated existing publish marks for publishId:', publishId, 'to:', securedMark);
            } else {
                // Add new publish marks
                performance.totalMarksArray.push({ publishId, marks: securedMark });
                console.log('Added new publish marks for publishId:', publishId, 'with marks:', securedMark);
                
                // Check if this is the first actual attempt for this specific publish
                shouldIncrementAttendedUsers = true;
                console.log('First attempt for this specific publish detected');
            }
            
            // Update bestMarkSecured if this attempt is higher
            const currentBest = performance.bestMarkSecured || 0;
            if (securedMark > currentBest) {
                performance.bestMarkSecured = securedMark;
                console.log('Updated bestMarkSecured from', currentBest, 'to:', securedMark);
            } else {
                console.log('Best mark not updated. Current:', currentBest, 'New:', securedMark);
            }
            
            // Increment attempts count
            const currentAttempts = performance.attempts || 0;
            performance.attempts = currentAttempts + 1;
            console.log('Incremented attempts from', currentAttempts, 'to:', performance.attempts);
            
            await performance.save();
            console.log('Updated existing StudentPerformance:', performance._id);
            console.log('Final performance data:', {
                bestMarkSecured: performance.bestMarkSecured,
                attempts: performance.attempts,
                totalMarksArrayLength: performance.totalMarksArray.length
            });
        }
    } catch (error) {
        console.error('Error updating StudentPerformance:', error);
        
        // If there's a duplicate key error, try to find and update the existing record
        if (error.code === 11000) {
            console.log('Duplicate key error, finding existing record...');
            performance = await StudentPerformance.findOne({ studentId, examId });
            if (performance) {
                const markObj = performance.totalMarksArray.find(m => m.publishId.toString() === publishId.toString());
                
                if (markObj) {
                    markObj.marks = securedMark;
                } else {
                    performance.totalMarksArray.push({ publishId, marks: securedMark });
                    shouldIncrementAttendedUsers = true;
                }
                
                if (securedMark > (performance.bestMarkSecured || 0)) {
                    performance.bestMarkSecured = securedMark;
                }
                
                performance.attempts = (performance.attempts || 0) + 1;
                await performance.save();
                console.log('Updated StudentPerformance after duplicate key error:', performance._id);
            }
        } else {
            throw error;
        }
    }

    // 7. Check StudentExamAttempt to determine if we should increment attendedUsers
    // If existingAttempt.attendedStatus was false, this is the first time attending this specific publish
    if (existingAttempt && existingAttempt.attendedStatus === false) {
        shouldIncrementAttendedUsers = true;
        console.log('StudentExamAttempt attendedStatus was false, marking for attendedUsers increment');
    }

    // 8. Update Publish model attendedUsers count if this is first time attempt for this specific publish
    if (shouldIncrementAttendedUsers) {
        try {
            // Update the attendedUsers count for this specific publish
            await Publish.findByIdAndUpdate(
                publishId,
                { $inc: { attendedUsers: 1 } },
                { new: true }
            );
            console.log('Updated Publish attendedUsers count for publishId:', publishId);
        } catch (error) {
            console.error('Error updating Publish attendedUsers:', error);
            // Don't fail the entire operation if this update fails
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            securedMark,
            attemptId: attempt._id,
            performanceId: performance?._id || null,
            performanceUpdated: !!performance
        }
    });
};

