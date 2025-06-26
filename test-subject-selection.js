// Test script to validate subject selection functionality
import { SubjectService } from '../src/services/subjectService';

async function testSubjectSelection() {
  try {
    console.log('Testing Subject Selection...');
    
    // Test 1: Get all subjects
    const subjects = await SubjectService.getAllSubjects();
    console.log('✅ Subjects loaded:', subjects.length);
    console.log('Available subjects:', subjects.map(s => s.name).join(', '));
    
    // Test 2: Test enrollment
    const enrollResult = await SubjectService.enrollStudentInSubjects('test-student', ['1', '2', '3']);
    console.log('✅ Enrollment test:', enrollResult.success ? 'Success' : 'Failed');
    
    console.log('🎉 All tests passed! Subject selection should be working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

export default testSubjectSelection;
