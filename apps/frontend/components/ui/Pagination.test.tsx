import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

// task-303 (Reservation Module Addendum #3)
describe("Pagination", () => {
  it("renders nothing when there's only one page and no onLimitChange (existing behavior, unchanged)", () => {
    const { container } = render(<Pagination meta={{ page: 1, limit: 20, total: 5, totalPages: 1 }} onPageChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("still renders Previous/Next when there are multiple pages, with no page-size control by default", () => {
    render(<Pagination meta={{ page: 1, limit: 20, total: 40, totalPages: 2 }} onPageChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Rows per page")).not.toBeInTheDocument();
  });

  it("shows the page-size selector even on a single page when onLimitChange is provided", () => {
    render(<Pagination meta={{ page: 1, limit: 20, total: 5, totalPages: 1 }} onPageChange={jest.fn()} limit={20} onLimitChange={jest.fn()} />);
    expect(screen.getByLabelText("Rows per page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("calls onLimitChange with the selected numeric value", async () => {
    const user = userEvent.setup();
    const onLimitChange = jest.fn();
    render(
      <Pagination meta={{ page: 1, limit: 20, total: 5, totalPages: 1 }} onPageChange={jest.fn()} limit={20} onLimitChange={onLimitChange} />,
    );

    await user.selectOptions(screen.getByLabelText("Rows per page"), "50");

    expect(onLimitChange).toHaveBeenCalledWith(50);
  });
});
