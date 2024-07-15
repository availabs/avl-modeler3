import { TasksBreadcrumb } from "./TasksBreadcrumb";
export const TasksLayout = ({ children }) => {
  return (
    <>
      <TasksBreadcrumb />
      <div className="mt-4">{children}</div>
    </>
  );
};
