#!/usr/bin/env bash

set -eu;

# shellcheck source=scripts/_util.sh
source "$(dirname "$0")/_util.sh"

declare -r gha_sa='github-actions-sa'
declare -r gha_ns='cicd'
declare -i print=0
declare -i recreate=0
declare -i delete=0
declare -i recreate_sa=0
declare -i delete_sa=0
declare -r base_rb_name='github-actions'
declare -r tst_url='https://api.r3vzjvjk.westeurope.aroapp.io:6443'
declare -r -a admin_namespaces=(
    cicd
    build
)
declare -r -a edit_namespaces=(
    # Add new namespaces here
    coop-vn-tst
    iga-ca-tst
    loyalty-tst
    oxxo-mx-tst
    safeway-ca-tst
)
declare -r -a cluster_roles=(
    namespace-editor
    self-provisioner
    # registry-editor
)

_check_login_status() {
    local cluster=
    # shellcheck disable=SC2310
    if ! cluster="$(set -e; _get_current_cluster)"; then
        _error 'Please log into the TST cluster'
    fi

    if [ "$cluster" != "$tst_url" ]; then
        _error Please log into the TST cluster. Currently logged into "$cluster"
    fi
}

_setup_binding() {
    local type="$1"
    local name="$2"
    local role="$3"
    local ns="${4:-}"

    # shellcheck disable=SC2310
    if _check_binding "$type" "$name" "$ns"; then
        if [ "$delete" -eq 1 ]; then
            _delete_binding "$type" "$name" "$ns"
        elif [ "$recreate" -eq 1 ]; then
            _delete_binding "$type" "$name" "$ns"
            _create_binding "$type" "$name" "$role" "${gha_ns}:${gha_sa}" "$ns"
        else
            _ignore_existing "$type" "$name" "$ns"
        fi
    elif [ "$delete" -eq 1 ]; then
        _ignore_missing "$type" "$name" "$ns"
    else
        _create_binding "$type" "$name" "$role" "${gha_ns}:${gha_sa}" "$ns"
    fi
}

_setup_edit_rolebindings() {
    for ns in "${edit_namespaces[@]}"; do
        local rb="${base_rb_name}-edit-${ns}"
        _setup_binding 'rolebinding' "$rb" 'edit' "$ns"
    done
}

_setup_admin_rolebindings() {
    for ns in "${admin_namespaces[@]}"; do
        local rb="${base_rb_name}-admin-${ns}"
        _setup_binding 'rolebinding' "$rb" 'admin' "$ns"
    done
}

_setup_cluster_rolebindings() {
    for cr in "${cluster_roles[@]}"; do
        local crb="${base_rb_name}-${cr}"
        _setup_binding 'clusterrolebinding' "$crb" "$cr"
    done
}

_run() {
    _check_login_status

    if [ "$print" -eq 1 ]; then
        _print_sa_token "$gha_sa" "$gha_ns"
        exit;
    fi
    if [ "$delete" -eq 1 ]; then
        _confirm 'Are you sure you want to delete existing bindings?'
    elif [ "$recreate" -eq 1 ]; then
        _confirm 'Are you sure you want to recreate existing bindings?'
    fi

    _setup_edit_rolebindings
    _setup_admin_rolebindings
    _setup_cluster_rolebindings

    echo
    echo OK!
}

while getopts ':pRDQXe:' arg "$@"; do
	case "${arg}" in
        p) print=1 ;;
        R) recreate=1 ;;
        D) delete=1 ;;
        Q) recreate_sa=1 ;;
        X) delete_sa=1 ;;
        e) true ;;
        *) _error "Unrecognized option" "${@:$OPTIND-1:1}" ;;
	esac
done

_run
