import TaskList from "./TaskList";
import { TasksLayout } from "./components/TasksLayout";

const TasksComponent = (props) => {
  return (
    <TasksLayout>
      <TaskList {...props} />
    </TasksLayout>
  );
};
export default TasksComponent;
