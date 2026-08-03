"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { roleService } from "../services/role.service";
import { useCreateMenu, useMenus, useUpdateMenuPermissions } from "../hooks/useMenu";
import { Menu, Permission } from "../types/system.types";

// No reorder/update-label/delete route exists (create + list +
// permissions-replace only, confirmed) -- this is a flat list with a
// parent column, not a drag-to-reorder tree builder.
export function MenusPage() {
  const { data, isLoading, isError, error, refetch } = useMenus();
  const [showCreate, setShowCreate] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  const menuLabel = (id: string | null) => data?.items.find((m) => m.id === id)?.label ?? "-";

  const createAction = (
    <PermissionGuard permission="system.menu.manage">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Menu Item
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading menus..." rows={4} columns={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const menus = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Menus</h1>
        {createAction}
      </div>

      {menus.length === 0 ? (
        <EmptyState title="No menu items yet" description="Create the first menu item." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Label</TableHeaderCell>
              <TableHeaderCell>Route</TableHeaderCell>
              <TableHeaderCell>Parent</TableHeaderCell>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id}>
                <TableCell>{menu.label}</TableCell>
                <TableCell>{menu.route ?? "-"}</TableCell>
                <TableCell>{menuLabel(menu.parentId)}</TableCell>
                <TableCell className="font-tabular">{menu.order}</TableCell>
                <TableCell>
                  <PermissionGuard permission="system.menu.manage">
                    <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setEditingMenu(menu)}>
                      Permissions
                    </button>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateMenuModal menus={menus} onClose={() => setShowCreate(false)} />}
      {editingMenu && <MenuPermissionsModal menu={editingMenu} onClose={() => setEditingMenu(null)} />}
    </div>
  );
}

function CreateMenuModal({ menus, onClose }: { menus: Menu[]; onClose: () => void }) {
  const [menuKey, setMenuKey] = useState("");
  const [label, setLabel] = useState("");
  const [route, setRoute] = useState("");
  const [parentId, setParentId] = useState("");
  const [order, setOrder] = useState("0");
  const createMenu = useCreateMenu();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!menuKey.trim() || !label.trim()) return;
    createMenu.mutate(
      { menuKey, label, route: route || undefined, parentId: parentId || undefined, order: Number(order) },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Menu Item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="menuKey" label="Menu Key" value={menuKey} onChange={(e) => setMenuKey(e.target.value)} required />
        <Input id="menuLabel" label="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <Input id="menuRoute" label="Route (optional)" placeholder="/warehouse/items" value={route} onChange={(e) => setRoute(e.target.value)} />
        <Select id="menuParent" label="Parent (optional)" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">None (top-level)</option>
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <Input id="menuOrder" label="Order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />

        {createMenu.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createMenu.error)}
          </p>
        )}
        <Button type="submit" isLoading={createMenu.isPending} disabled={!menuKey.trim() || !label.trim()}>
          Create Menu Item
        </Button>
      </form>
    </Modal>
  );
}

function MenuPermissionsModal({ menu, onClose }: { menu: Menu; onClose: () => void }) {
  const { data: permissionsData, isLoading } = useQuery({ queryKey: ["system", "permissions", "options"], queryFn: () => roleService.listPermissions() });
  // GET /system/menus returns the raw Menu entity, not permissionIds -- and
  // there's no GET /system/menus/:id detail route either (confirmed) -- so
  // this modal genuinely cannot know a menu's current permission grants on
  // open. Starts empty and PATCH replaces wholesale; same class of gap as
  // system.md §4/§5's flagged Role-Permissions pre-population bug, but here
  // it's a missing read endpoint, not a client-side state bug to fix.
  const [selected, setSelected] = useState<string[]>([]);
  const updateMenuPermissions = useUpdateMenuPermissions();

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSave() {
    updateMenuPermissions.mutate({ menuId: menu.id, permissionIds: selected }, { onSuccess: () => onClose() });
  }

  const groupedByModule = (permissionsData?.items ?? []).reduce<Record<string, Permission[]>>((acc, permission) => {
    (acc[permission.module] ??= []).push(permission);
    return acc;
  }, {});

  return (
    <Modal title={`Permissions — ${menu.label}`} onClose={onClose}>
      {isLoading && <LoadingState label="Loading permissions..." />}
      {!isLoading && (
        <div className="flex flex-col gap-3">
          <div className="max-h-72 overflow-y-auto">
            {Object.entries(groupedByModule).map(([module, permissions]) => (
              <fieldset key={module} className="mb-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-muted">{module}</legend>
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 py-1 text-sm text-foreground">
                    <input type="checkbox" checked={selected.includes(permission.id)} onChange={() => toggle(permission.id)} />
                    {permission.permissionName}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          {updateMenuPermissions.isError && (
            <p role="alert" className="text-sm text-error">
              {getApiErrorMessage(updateMenuPermissions.error)}
            </p>
          )}
          <Button type="button" isLoading={updateMenuPermissions.isPending} onClick={handleSave}>
            Save Permissions
          </Button>
        </div>
      )}
    </Modal>
  );
}
