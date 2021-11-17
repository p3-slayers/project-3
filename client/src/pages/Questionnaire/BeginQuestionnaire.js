import React from 'react';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';

const BeginQuestionnaire = () => {
  return (
    <div className="container text-center mt-5 pt-5">
      {/* will inserts information/summary about the User */}
      <h1>Begin Questionnaire</h1>
      <p className="my-4"> You will begin a questionnaire broken down into five categories, with questions for each category. Please rate how strongly you agree or disagree with each statement.</p>
      <Link to="/questionnaire"><Button variant="primary" className="mt-4" size="lg">Start</Button>{' '}</Link>
    </div>
  );
};

export default BeginQuestionnaire;
